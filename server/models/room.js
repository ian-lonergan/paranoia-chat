'use strict';

var _ = require('lodash');

// object representing a Room
function Room (name, owner, password) {
  this.name = name;
  this.owner = owner;
  this.password = password;
  this.players = {};
}

// get the name of the room
Room.prototype.getName = function () {
  return this.name;
};

// get the owner of the room
Room.prototype.getOwner = function () {
  return this.owner;
};

// find a room by name
Room.prototype.findPlayerByName = function (name) {
  if (_.has(this.players, name)) {
    return this.players[name];
  } else {
    return false;
  }
};

// get whether the room is public or not
Room.prototype.getIsPublic = function () {
  return (this.password && this.password.length) > 0 ? true : false;
};

// get a list of players in the room
Room.prototype.getPlayers = function () {
  return _.values(this.players);
};

// get a count of players in the room
Room.prototype.getPlayerCount = function () {
  return this.getPlayers().length;
};

// add a player to the room
Room.prototype.addPlayer = function (user) {
  if (!_.has(this.players, user.name)) {
    this.players[user.name] = user;
    return true;
  } else {
    return false;
  }
};

// remove a player from the room
Room.prototype.removePlayer = function (user) {
  if (_.has(this.players, user.name)) {
    delete this.players[user.name];
    return true;
  } else {
    return false;
  }
};

// get for printing
Room.prototype.get = function () {
  var players = {}
  _.values(this.players).forEach(function (player) {
    players[player.name] = player.get();
  });
  return {
    name: this.name,
    owner: this.owner.get(),
    players: this.getPlayers().map(function(player) { return player.get(); })
  }
};

// expose API
module.exports = Room;