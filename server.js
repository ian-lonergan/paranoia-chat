'use strict';

var express = require('express'),
    path = require('path');

// set node environment to development environment if not already set to anything
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./server/config/config'),
    app = require('./server/config/express')(config),
    httpServer = require('http').Server(app),
    io = require('socket.io')(httpServer);

// Start the app by listening on <port>
httpServer.listen(config.port);

// configure sockets
require('./server/config/socket')(io);

// handle get requests
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

// Logging initialization
console.log('Application started on port ' + config.port);