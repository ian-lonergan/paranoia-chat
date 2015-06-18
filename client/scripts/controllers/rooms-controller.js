'use strict';

angular.module('paranoiaChat.rooms', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/rooms', {
      templateUrl: 'views/rooms/room_list.html',
      controller: 'RoomsController'
    })
      .when('/room', {
      templateUrl: 'views/rooms/room.html',
      controller: 'RoomController'
    })
      .when('/room/join', {
      templateUrl: 'views/rooms/room_join.html',
      controller: 'JoinRoomController'
    });
  }])

  .controller('RoomsController', function ($scope, $location, room) {
  var socket = room.getSocket();

  socket.emit('rooms::list');

  //properties for joining a new room
  $scope.name = '';
  $scope.joinAs = '';

  $scope.getRooms = room.getRooms;

  $scope.joinRoom = function (roomToJoin) {
    room.setRoomToJoin(roomToJoin);
    $location.path('/room/join');
  };

  $scope.createRoom = function (name, joinAs, password) {
    socket.emit('room::create', { name: name, user: { name: joinAs }, password: password });
  };
})

  .controller('RoomController', function ($scope, $location, room) {
  if (room.getRoom() === null) {
    $location.path('/rooms');
  }

  var socket = room.getSocket();

  $scope.messageInput = {
    body: ''
  };

  $scope.room = room.getRoom();
  $scope.me = room.getMe();

  $scope.sendMessage = function () {
    if (!$scope.messageInput) {
      return;
    }

    socket.emit('room::message', $scope.messageInput);
    $scope.messageInput = '';
  };

  $scope.$on('$destroy', function () {
    if ($scope.room) {
      socket.emit('room::leave');
    }
  });

  $scope.sendPrivateMessage = function (user) {
    if (!user.messageToSend) {
      return;
    }

    socket.emit('room::message::private', { to: { name: user.name, isOwner: user.isOwner }, body: user.messageToSend });
    user.messageToSend = '';
  };
})

  .controller('JoinRoomController', function ($scope, $location, room) {
  var socket = room.getSocket(),
      roomToJoin = room.getRoomToJoin();
  
  $scope.room = {
    name: roomToJoin.name,
    user: {
      name: null,
      character: {
        name: null,
        rank: 'R',
        sector: null,
        cloneNumber: 1,
        mutantPower: null,
        secretSociety: null
      }
    }
  };
  
  $scope.joinRoom = function () {
    socket.emit('room::join', $scope.room);
  };
});