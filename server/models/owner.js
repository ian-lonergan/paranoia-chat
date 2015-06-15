'use strict';

var User = require('./user'),
    _ = require('lodash');

var Owner = function (name, socket) {
  User.call(this, name, true, socket);
};

// set inheritance
Owner.prototype = Object.create(User.prototype);
Owner.prototype.constructor = Owner;

// expose API
module.exports = Owner;