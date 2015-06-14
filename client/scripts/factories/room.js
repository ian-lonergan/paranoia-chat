'use strict';

angular.module('paranoiaChat')
  .factory('User', function () {
  var User = function (name, isOwner, me) {
    this.name = name;
    this.isOwner = isOwner;
    if (me) {
      if (this.isOwner) {
        this.isMe = me.isOwner;
      } else {
        this.isMe = name === me.name;
      }
    } else {
      this.isMe = false;
    }
    this.privateMessages = [];
  };

  User.prototype.getPrivateMessages = function () {
    return this.privateMessages;
  };

  User.prototype.addPrivateMessage = function (message) {
    this.privateMessages.push(message);
  };

  return User;
})
  .factory('Room', function (User) {
  var Room = function (name, owner, players, me) {
    var self = this;

    this.name = name;
    this.owner = new User(owner.name, true, me);
    this.players = {};
    this.messages = [];

    players.forEach(function (player) {
      self.players[player.name] = new User(player.name, false, me);
    });
  }

  Room.prototype.getPlayers = function () {
    var players = [];
    self = this;
    for (var key in self.players) {
      players.push(self.players[key]);
    }
    return players;
  }

  Room.prototype.addPlayer = function (player) {
    this.players[player.name] = new User(player.name, false);
  };

  Room.prototype.getPlayer = function (player) {
    return this.players[player.name];
  };

  Room.prototype.getOwner = function () {
    return this.owner;
  };

  Room.prototype.removePlayer = function (player) {
    delete this.players[player.name];
  };

  Room.prototype.getMessages = function () {
    return this.messages;
  };

  Room.prototype.addMessage = function (message) {
    this.messages.push(message);
  };
  
  Room.prototype.getMe = function () {
    self = this;
    for (var key in self.players) {
      if (self.players[key].isMe) {
        return self.players[key];
      }
    }
    
    return null;
  };

  return Room;
})
  .factory('room', function (socketFactory, User, Room, $location) {
  var myRoom = null,
      allRooms = {},
      socket = socketFactory();

  socket.connect();

  socket.on('rooms::list', function (roomList) {
    allRooms = {};
    roomList.forEach(function (room) {
      allRooms[room.name] = new Room(room.name, room.owner, room.players, null);
    });
  });

  socket.on('room::leave', function (user) {
    myRoom = null;
    $location.path('/rooms');
  });

  socket.on('room::create', function (room) {
    myRoom = new Room(room.name, room.owner, room.players, room.owner);
    $location.path('/room');
  });

  socket.on('room::join', function (data) {
    myRoom = new Room(data.room.name, data.room.owner, data.room.players, data.me);
    $location.path('/room');
  });

  socket.on('room::message', function (message) {
    myRoom.addMessage(message);
  });

  socket.on('room::message::private', function (message) {
    var from = message.from.isOwner ? myRoom.owner : myRoom.players[message.from.name];
    from.addPrivateMessage(message);
  });

  socket.on('room::message::private::confirmation', function (message) {
    var to = message.to.isOwner ? myRoom.owner : myRoom.players[message.to.name];
    message.from = myRoom.getMe();
    to.addPrivateMessage(message);
  });

  socket.on('room::delete', function (message) {
    myRoom = null;
    $location.path('/rooms');
  });

  socket.on('room::player::add', function (user) {
    myRoom.addPlayer(user);
  });

  socket.on('room::player::remove', function (user) {
    myRoom.removePlayer(user);
  });

  var room = {
    getRooms: function () {
      if (allRooms) {
        return Object.keys(allRooms).map(function (key) { return allRooms[key]; });
      } else {
        return [];
      }
    },
    getRoom: function () {
      return myRoom;
    },
    getSocket: function () {
      return socket;
    }
  };

  return room;
});