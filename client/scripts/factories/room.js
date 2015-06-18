'use strict';

angular.module('paranoiaChat')
  .factory('Character', function () {
  var Character = function (name, rank, sector, cloneNumber, mutantPower, secretSociety) {
    this.name = name;
    this.rank = rank;
    this.sector = sector;
    this.cloneNumber = cloneNumber;
    this.mutantPower = mutantPower;
    this.secretSociety = secretSociety;
  };

  Character.prototype.getColor = function () {
    switch (this.rank) {
      case 'R':
        return 'red';
      case 'O':
        return 'orange';
      case 'Y':
        return 'yellow';
      case 'G':
        return 'green';
      case 'B':
        return 'blue';
      case 'I':
        return 'indigo';
      case 'V':
        return 'violet';
      case 'U':
        return 'gray';
      default:
        return 'black';
    }
  };

  Character.prototype.getFullName = function () {
    return this.name + '-' + this.rank + '-' + this.sector + (this.cloneNumber && this.cloneNumber > 1 ? '-' + this.cloneNumber : '');
  };
  
  Character.createFromObject = function (characterObject) {
    return new Character(characterObject.name, characterObject.rank, characterObject.sector, characterObject.cloneNumber, characterObject.mutantPower, characterObject.secretSociety);
  };

  return Character;
})
  .factory('User', function () {
  var User = function (name, isOwner) {
    this.name = name;
    this.isOwner = isOwner;
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
  .factory('Player', function (User, Character) {
  var Player = function (name, character) {
    User.call(this, name, false);

    this.character = character;
  };

  // set inheritance
  Player.prototype = Object.create(User.prototype);
  Player.prototype.constructor = Player;
  
  Player.prototype.getChatName = function () {
    return this.character.getFullName();
  };
  
  Player.prototype.getChatColor = function () {
    return this.character.getColor();
  };
  
  Player.createFromObject = function (playerObject) {
    var character = Character.createFromObject(playerObject.character);
    return new Player(playerObject.name, character);
  };

  return Player;
})
  .factory('Owner', function (User) {
  var Owner = function (name) {
    User.call(this, name, true);
  };

  // set inheritance
  Owner.prototype = Object.create(User.prototype);
  Owner.prototype.constructor = Owner;
  
  Owner.prototype.getChatName = function () {
    return this.name;
  };
  
  Owner.prototype.getChatColor = function () {
    return 'black';
  };
  
  Owner.createFromObject = function (ownerObject) {
    return new Owner(ownerObject.name);
  };

  return Owner;
})
  .factory('Room', function (Owner, Player) {
  var Room = function (name, owner, players, me) {
    var self = this;

    this.name = name;
    this.owner = Owner.createFromObject(owner);
    this.players = {};
    this.messages = [];

    players.forEach(function (player) {
      self.players[player.name] = Player.createFromObject(player);
    });
  };

  Room.prototype.getPlayers = function () {
    var players = [],
        self = this;
    for (var key in self.players) {
      players.push(self.players[key]);
    }
    return players;
  };

  Room.prototype.addPlayer = function (player) {
    this.players[player.name] = Player.createFromObject(player);
  };

  Room.prototype.getPlayer = function (player) {
    return this.players[player.name];
  };

  Room.prototype.getOwner = function () {
    return this.owner;
  };

  Room.prototype.getUser = function (user) {
    if (user.isOwner === true) {
      return this.getOwner();
    } else {
      return this.getPlayer(user);
    }
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

  return Room;
})
  .factory('room', function (socketFactory, User, Room, $location) {
  var myRoom = null,
      me = null,
      roomToJoin = null,
      allRooms = {},
      socket = socketFactory();

  socket.connect();

  socket.on('rooms::list', function (roomList) {
    allRooms = {};
    roomList.forEach(function (room) {
      allRooms[room.name] = new Room(room.name, room.owner, room.players);
    });
  });

  socket.on('room::leave', function (user) {
    myRoom = null;
    me = null;
    $location.path('/rooms');
  });

  socket.on('room::create', function (room) {
    myRoom = new Room(room.name, room.owner, room.players, room.owner);
    me = myRoom.getOwner();
    $location.path('/room');
  });

  socket.on('room::join', function (data) {
    myRoom = new Room(data.room.name, data.room.owner, data.room.players, data.me);
    me = myRoom.getPlayer(data.me);
    $location.path('/room');
  });

  socket.on('room::message', function (message) {
    var from = myRoom.getUser(message.from),
        messageToAdd = { from: from, body: message.body };
    myRoom.addMessage(messageToAdd);
  });

  socket.on('room::message::private', function (message) {
    var from = myRoom.getUser(message.from),
        messageToAdd = { from: from, body: message.body };
    from.addPrivateMessage(messageToAdd);
  });

  socket.on('room::message::private::confirmation', function (message) {
    var to = myRoom.getUser(message.to),
        messageToAdd = { from: me, body: message.body };
    to.addPrivateMessage(messageToAdd);
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
    },
    getRoomToJoin: function () {
      return roomToJoin;
    },
    setRoomToJoin: function (theRoom) {
      roomToJoin = theRoom;
    },
    getMe: function () {
      return me;
    }
  };

  return room;
});