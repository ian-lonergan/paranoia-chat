'use strict';

var User = function (name, isOwner, socket) {
  this.name = name;
  this.isOwner = isOwner;
  this.socket = socket;
};

User.prototype.getName = function () {
  return this.name;
};

User.prototype.getSocket = function () {
  return this.socket;
};

User.prototype.get = function () {
  return {
    name: this.name,
    isOwner: this.isOwner
  };
};

// expose API
module.exports = User;