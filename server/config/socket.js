'use strict';

var _ = require('lodash'),
    Room = require('../models/room'),
    User = require('../models/user'),
    RoomsController = require('../controllers/rooms-controller');

function removePlayerFromRoom(io, room, user) {
  if (room && user) {
    if (user === room.getOwner()) { // user is room owner
      // announce that the room has been deleted
      io.to(room.getName()).emit('room::delete', room.get());

      // remove the players from the room
      room.getPlayers().forEach(function (player) {
        var socket = player.getSocket();
        // leave the socket room
        socket.leave(socket.room.getName());

        // clear socket properties
        socket.room = null;
        socket.user = null;

        // remove the player from the room
        room.removePlayer(player);

        return true;
      });

      // delete the room
      RoomsController.deleteByName(room.getName());
    } else { // user is player
      var socket = user.getSocket();

      // tell the user to leave the room
      socket.emit('room::leave', room.get());

      // announce to the room that a player has left
      socket.broadcast.to(room.getName()).emit('room::player::remove', user.get());

      // leave the socket room
      socket.leave(socket.room.getName());

      // clear socket properties
      socket.room = null;
      socket.user = null;

      // remove the player from the room
      room.removePlayer(user);

      return true;
    }
  } else {
    //TODO: Handle no room or user
    return false;
  }
}

module.exports = function (io) {
  // handlers for rooms socket
  io.on('connection', function (socket) {
    // inform the user of available rooms
    var roomsForDisplay = RoomsController.getRooms().map(function (room) { return room.get(); });
    socket.emit('rooms::list', roomsForDisplay);   

    // get a list of all rooms
    socket.on('rooms::list', function() {
      // send the list of rooms
      var roomsForDisplay = RoomsController.getRooms().map(function (room) { return room.get(); });
      socket.emit('rooms::list', roomsForDisplay);
    });

    // attempt to create a room
    socket.on('room::create', function(newRoom) {
      var name = newRoom.name,
          password = newRoom.password,
          user = new User(newRoom.user.name, true, socket);

      if (!RoomsController.findByName(name)) {
        // try to create the new room
        var room = RoomsController.createRoom(name, user, password);

        // check if room was created successfully
        if (room) {
          // check if the player is already playing
          if (socket.room || socket.user) {
            // remove the player from their current room before they join a new one
            if (!removePlayerFromRoom(io, socket.room, socket.user)) {
              // tell the player there was a problem removing them from their current room
              socket.emit('room::leave::error', 'There was a problem removing you from your current room.');
              return;
            }
          }

          socket.user = user;
          socket.room = room;

          // put the client in the room
          socket.join(room.getName());

          // tell the client to move to the new room
          socket.emit('room::create', room.get());
        } else {
          //TODO: Handle room creation failed
          return;
        }
      } else {
        // tell the player the room was already created
        socket.emit('room::create::error', 'A room with that name already exists.');
      }
    });

    // attempt to join a room
    socket.on('room::join', function(toJoin) {
      var roomName = toJoin.name,
          userName = toJoin.user.name,
          room = RoomsController.findByName(roomName),
          user = new User(userName, false, socket);

      // check if room exists
      if (room) {
        // check if the player is already playing
        if (socket.room || socket.user) {
          // remove the player from their current room before they join a new one
          if (!removePlayerFromRoom(io, socket.room, socket.user)) {
            // tell the player there was a problem removing them from their current room
            socket.emit('room::leave::error', 'There was a problem removing you from your current room.');
            return;
          }
        }
        if (!room.findPlayerByName(userName)) {
          if (room.addPlayer(user)) {
            socket.user = user;
            socket.room = room;

            // announce to the room that a new user has joined
            io.to(room.getName()).emit('room::player::add', user.get());

            // put the client in the room
            socket.join(room.getName());

            // tell the client they are in a new room
            socket.emit('room::join', { me: user.get(), room: room.get() });
          } else {
            // This should not happen
            return;
          }
        } else {
          // tell client a player with that name already exists
          socket.emit('room::join::error', 'A user with that name already exists in that room.');
          return;
        }
      } else {
        socket.emit('room::join:error', 'A room with that name doesn\'t exist.');
        return;
      }
    });

    socket.on('room::leave', function () {
      var room = socket.room,
          user = socket.user;

      removePlayerFromRoom(io, room, user);
    });

    socket.on('room::message', function (message) {
      var room = socket.room,
          user = socket.user;

      if (room && user) {
        // send the message
        io.to(room.getName()).emit('room::message', { from: user.get(), body: message.body });
      } else { // handle socket does not actually have room or user
        //TODO: Handle socket doesn't have room or user
        return;
      }
    });

    socket.on('room::message::private', function (message) {
      var room = socket.room,
          from = socket.user,
          to = message.to.isOwner ? room.owner : room.findPlayerByName(message.to.name);

      if (to) {
        var socketToSend = to.getSocket();

        // send the private message and a confirmation
        socketToSend.emit('room::message::private', { from: from.get(), body: message.body });
        socket.emit('room::message::private::confirmation', { to: to.get(), body: message.body });
      } else {
        // tell the client that player doesn't exist
        socket.emit('room::message::private::error', 'A player by that name doesn\'t exist in that room.');
      }
    });

    socket.on('disconnect', function () {
      var room = socket.room,
          user = socket.user;

      removePlayerFromRoom(io, room, user);
    });
  });
};