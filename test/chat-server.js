/* jshint -W079 */
/* jshint expr: true */
'use strict';

process.env.NODE_ENV = 'development';

var config = require('../server/config/config'),
    expect = require('chai').expect,
    assert = require('chai').assert,
    io = require('socket.io-client');

var socketURL = 'http://localhost:' + config.port;

var socketOptions = {
  'force new connection': true
};

describe('Chat Server', function() {
  it('should respond to the first connection with an empty list of rooms', function(done) {
    var client = io.connect(socketURL, socketOptions);

    client.on('rooms::list', function(roomList) {
      expect(roomList).to.be.instanceof(Array);
      expect(roomList).to.have.length(0);

      client.disconnect();

      done();
    });
  });

  it('should respond to any new connection with the list of available rooms', function(done) {
    var firstClient = io.connect(socketURL, socketOptions),
        secondClient = null;

    var roomName = 'room name',
        ownerName = 'room owner',
        roomToCreate = { name: roomName, user: { name: ownerName }};

    firstClient.on('connect', function () {
      firstClient.on('room::create', function (room) {
        expect(room.name).to.equal(roomName);

        secondClient = io.connect(socketURL, socketOptions);

        secondClient.on('rooms::list', function(roomList) {
          expect(roomList).to.be.instanceof(Array);
          expect(roomList).to.have.length(1);
          expect(roomList[0].name).to.equal(roomName);
          expect(roomList[0].owner.name).to.equal(ownerName);

          firstClient.disconnect();
          secondClient.disconnect();

          done();
        });
      });

      firstClient.emit('room::create', roomToCreate);
    });
  });

  it('should send a user to a chat room they create', function (done) {
    var client = io.connect(socketURL, socketOptions);

    var roomName = 'room name';

    client.on('connect', function () {
      client.on('room::create', function (room) {
        expect(room.name).to.equal(roomName);

        client.disconnect();

        done();
      });

      client.emit('room::create', { name: roomName, user: { name: 'user name' }});
    });
  });

  it('should allow users to join a chat room', function (done) {
    var roomOwner = io.connect(socketURL, socketOptions),
        player = io.connect(socketURL, socketOptions);

    var roomName = 'room',
        ownerName = 'owner',
        playerName = 'player';

    roomOwner.on('connect', function() {
      roomOwner.on('room::create', function() {
        player.on('room::join', function(data) {
          expect(data.me.name).to.equal(playerName);
          expect(data.room.name).to.equal(roomName);
          expect(data.room.owner.name).to.equal(ownerName);

          done();
        });

        player.emit('room::join', { name: roomName, user: { name: playerName } });
      });
      roomOwner.emit('room::create', { name: roomName, user: { name: ownerName } });
    });
  });

  it('should send messages only within a room', function (done) {
    var firstInChat = io.connect(socketURL, socketOptions),
        secondInChat = io.connect(socketURL, socketOptions),
        thirdInChat = io.connect(socketURL, socketOptions),
        notInChat = io.connect(socketURL, socketOptions);

    var roomName = 'room name',
        messageSenderName = 'sender',
        roomData = { name: roomName },
        messageToSend = { body: 'hello' },
        messageCount = 0;

    var finishTest = function () {
      expect(messageCount).to.equal(3);

      firstInChat.disconnect();
      secondInChat.disconnect();
      thirdInChat.disconnect();
      notInChat.disconnect();

      done();
    };

    var getMessage = function (client) {
      client.on('room::message', function(message) {
        messageCount += 1;
        if (client === notInChat) {
          assert.notOk('notInChat','got chat message');
        } else {
          expect(message.body).to.equal(messageToSend.body);
          expect(message.from.name).to.equal(messageSenderName);
        }

        if (messageCount === 3) {
          // if we have gotten three messages, wait a little
          // just in case there might be a fourth bad one then
          // finish test.
          setTimeout(finishTest, 50);
        }
      });
    };

    getMessage(notInChat);
    firstInChat.on('room::create', function (data) {
      getMessage(firstInChat);
      secondInChat.on('room::join', function (data) {
        getMessage(secondInChat);
        thirdInChat.on('room::join', function (data) {
          getMessage(thirdInChat);

          thirdInChat.emit('room::message', messageToSend);
        });
        thirdInChat.emit('room::join', { name: roomName, user: { name: messageSenderName }});
      });
      secondInChat.emit('room::join', { name: roomName, user: { name: 'second' }});
    });
    firstInChat.emit('room::create', { name: roomName, user: { name: 'first' }});
  });

  it('should send a user to a chat room they join', function (done) {
    var firstClient = io.connect(socketURL, socketOptions),
        secondClient = io.connect(socketURL, socketOptions);

    var roomName = 'room name',
        playerName = 'player name';

    firstClient.on('room::create', function () {
      secondClient.on('room::join', function(data) {
        expect(data.room.name).to.equal(roomName);
        expect(data.me.name).to.equal(playerName);

        firstClient.disconnect();
        secondClient.disconnect();

        done();
      });

      secondClient.emit('room::join', { name: roomName, user: { name: playerName }});
    });

    firstClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should send an error to a user who tries to create an already named chatroom', function (done) {
    var firstClient = io.connect(socketURL, socketOptions),
        secondClient = io.connect(socketURL, socketOptions);

    var roomName = 'room name';

    firstClient.on('room::create', function (room) {
      secondClient.on('room::create::error', function (errorMessage) {
        firstClient.disconnect();
        secondClient.disconnect();

        done();
      });

      secondClient.emit('room::create', { name: roomName, user: { name: 'user name 2' }});
    });

    firstClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should send an error to a user tries to use a name that is already taken', function (done) {
    var ownerClient = io.connect(socketURL, socketOptions),
        firstPlayer = io.connect(socketURL, socketOptions),
        secondPlayer = io.connect(socketURL, socketOptions);

    var roomName = 'room name',
        userName = 'user name';

    ownerClient.on('room::create', function () {
      firstPlayer.on('room::join', function () {
        secondPlayer.on('room::join::error', function () {
          ownerClient.disconnect();
          firstPlayer.disconnect();
          secondPlayer.disconnect();

          done();
        });
        secondPlayer.emit('room::join', { name: roomName, user: { name: userName }});
      });  
      firstPlayer.emit('room::join', { name: roomName, user: { name: userName }});
    });

    ownerClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should kick a player out of a room they leave', function (done) {
    var ownerClient = io.connect(socketURL, socketOptions),
        playerClient = io.connect(socketURL, socketOptions);

    var roomName = 'room name';

    ownerClient.on('room::create', function (room) {
      playerClient.on('room::join', function (errorMessage) {
        playerClient.on('room::leave', function () {
          ownerClient.disconnect();
          playerClient.disconnect();

          done();
        });

        playerClient.emit('room::leave');
      });

      playerClient.emit('room::join', { name: roomName, user: { name: 'user name 2' }});
    });

    ownerClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should kick everyone out of a room if the owner leaves', function (done) {
    var ownerClient = io.connect(socketURL, socketOptions),
        playerClient = io.connect(socketURL, socketOptions);

    var roomName = 'room name',
        deletedRooms = 0;

    var roomDeleted = function (room) {
      expect(room.name).to.equal(roomName);
      deletedRooms++;
      if (deletedRooms >= 2) {
        ownerClient.disconnect();
        playerClient.disconnect();

        done();
      }
    };

    ownerClient.on('room::create', function (room) {
      playerClient.on('room::join', function (errorMessage) {
        ownerClient.on('room::delete', function(room) {
          roomDeleted(room);
        });

        playerClient.on('room::delete', function (room) {
          roomDeleted(room);
        });

        ownerClient.emit('room::leave');
      });

      playerClient.emit('room::join', { name: roomName, user: { name: 'user name 2' }});
    });

    ownerClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should inform people in a room if a player manually leaves the room', function (done) {
    var ownerClient = io.connect(socketURL, socketOptions),
        playerClient = io.connect(socketURL, socketOptions);

    var roomName = 'room name',
        playerName = 'leaving player';

    ownerClient.on('room::create', function () {
      playerClient.on('room::join', function () {
        ownerClient.on('room::player::remove', function (player) {
          expect(player.name).to.equal(playerName);

          ownerClient.disconnect();
          playerClient.disconnect();

          done();
        });

        playerClient.emit('room::leave');
      });

      playerClient.emit('room::join', { name: roomName, user: { name: playerName }});
    });

    ownerClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should inform people in a room if a player leaves by creating another room', function(done) {
    var ownerClient = io.connect(socketURL, socketOptions),
        playerClient = io.connect(socketURL, socketOptions);

    var roomName = 'roomName',
        otherRoomName = 'otherRoom',
        playerName = 'playerName';

    ownerClient.on('room::create', function () {
      playerClient.on('room::join', function () {
        ownerClient.on('room::player::remove', function (player) {
          expect(player.name).to.equal(playerName);

          ownerClient.disconnect();
          playerClient.disconnect();

          done();
        });

        playerClient.emit('room::create', { name: otherRoomName, user: { name: playerName }});
      });

      playerClient.emit('room::join', { name: roomName, user: { name: playerName }});
    });

    ownerClient.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should inform people in a room if a player leaves by joining another room', function(done) {
    var ownerClient1 = io.connect(socketURL, socketOptions),
        ownerClient2 = io.connect(socketURL, socketOptions),
        playerClient = io.connect(socketURL, socketOptions);

    var roomName = 'roomName',
        otherRoomName = 'otherRoom',
        playerName = 'playerName';

    ownerClient1.on('room::create', function () {
      ownerClient2.on('room::create', function () {
        playerClient.on('room::join', function () {
          ownerClient1.on('room::player::remove', function (player) {
            expect(player.name).to.equal(playerName);

            ownerClient1.disconnect();
            ownerClient2.disconnect();
            playerClient.disconnect();

            done();
          });

          playerClient.emit('room::join', { name: otherRoomName, user: { name: playerName }});
        });

        playerClient.emit('room::join', { name: roomName, user: { name: playerName }});
      });

      ownerClient2.emit('room::create', { name: otherRoomName, user: { name: 'user name' }});
    });

    ownerClient1.emit('room::create', { name: roomName, user: { name: 'user name' }});
  });

  it('should allow a user to send a private message to the owner', function (done) {
    debugger;
    var ownerClient = io.connect(socketURL, socketOptions),
        playerClient = io.connect(socketURL, socketOptions);

    var roomName = 'room name',
        ownerName = 'owner',
        playerName = 'player',
        messageBody = 'hello',
        messagesReceived = 0;

    var receivedMessage = function() {
      messagesReceived++;
      if (messagesReceived === 2) {
        ownerClient.disconnect();
        playerClient.disconnect();

        done();
      }
    };

    ownerClient.on('room::create', function () {
      playerClient.on('room::join', function () {
        ownerClient.on('room::message::private', function (message) {
          expect(message.from.name).to.equal(playerName);
          expect(message.body).to.equal(messageBody);

          receivedMessage();
        });

        playerClient.on('room::message::private::confirmation', function(message) {
          expect(message.to.isOwner).to.be.true;
          expect(message.body).to.equal(messageBody);

          receivedMessage();
        });

        playerClient.emit('room::message::private', { body: messageBody, to: { isOwner: true } });
      });

      playerClient.emit('room::join', { name: roomName, user: { name: playerName }});
    });

    ownerClient.emit('room::create', { name: roomName, user: { name: ownerName }});
  });
});