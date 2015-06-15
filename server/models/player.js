'use strict';

var User = require('./user'),
    _ = require('lodash');

var Player = function (name, socket, character) {
  User.call(this, name, false, socket);

  this.character = character;
};

// set inheritance
Player.prototype = Object.create(User.prototype);
Player.prototype.constructor = Player;

Player.prototype.get = function () {
  return _.merge(User.prototype.get.call(this), { character: this.character.get() });
};

// expose API
module.exports = Player;