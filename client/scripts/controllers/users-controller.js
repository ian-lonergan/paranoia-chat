'use strict';

angular.module('paranoiaChat.rooms')
  .controller('UsersController', function ($scope, room) {
  var socket = room.getSocket();
  
  $scope.sendPrivateMessage = function (user) {
    if (!user.messageToSend) {
      return;
    }

    socket.emit('room::message::private', { to: { name: user.name, isOwner: user.isOwner }, body: user.messageToSend });
    user.messageToSend = '';
  };
});