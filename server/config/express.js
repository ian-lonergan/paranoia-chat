'use strict';

var express = require('express'),
    path = require('path'),
    config = require('./config');

var secret = 'TODO';

module.exports = function(config) {
  var app = express();

  app.use(express.static(path.join(config.root, 'client')));
  app.set('views', config.root + '/client/views');

  if (config.env === 'development') {
    // Don't cache scripts
    app.use(function noCache(req, res, next) {
      if (req.url.indexOf('/scripts/') === 0) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', 0);
      }
      next();
    });

    app.use(express.static(path.join(config.root, '.tmp')));
  }
  
  return app;
};