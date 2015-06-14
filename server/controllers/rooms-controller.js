'use strict';

var _ = require('lodash'),
    Room = require('../models/room'),
    User = require('../models/user');

var rooms = {};

// get a list of all rooms
module.exports.getRooms = function () {
  return _.values(rooms);
};

// find a room by name
module.exports.findByName = function (name) {
  if (_.has(rooms, name)) {
    return rooms[name];
  } else {
    return false;
  }
};

// create a new room
module.exports.createRoom = function (name, user, password) {
  // check the room doesn't already exist
  if (!_.has(rooms, name)) {
    var room = new Room(name, user, password);
    rooms[room.getName()] = room;
    return room;
  } else {
    return false;
  }
};

// delete a room
module.exports.deleteByName = function (name) {
  if (_.has(rooms, name)) {
    delete rooms[name];
    return true;
  } else {
    return false;
  }
};