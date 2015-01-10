/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var createHash = require('crypto').createHash;

var mysql = require('mysql');
var config = require('../config');
var log = require('../logger')('server.db.utils');

module.exports = {
  createUrlHash: function (url) {
    return createHash('sha1').update(url).digest('hex').toString();
  },
  createPool: function(unsetDatabaseName) {
    var params = {
      connectionLimit: config.get('db.mysql.connectionLimit'),
      host: config.get('db.mysql.host'),
      user: config.get('db.mysql.user'),
      password: config.get('db.mysql.password'),
      database: config.get('db.mysql.database'),
      timezone: 'Z'
    };
    // if we're creating the database, we can't ask for it in the connection
    if (unsetDatabaseName) {
      delete params.database;
    }
    var pool = mysql.createPool(params);

    // if we're developing locally, be sure to set timezone to UTC,
    // otherwise time debugging will be hilariously jumbled
    if (config.get('env') === 'local') {
      pool.on('connection', function onConnection(connection) {
        log.verbose('pool "connection" event fired, setting timezone');
        connection.query('SET time_zone=?', '+00:00');
      });
    }

    // TODO is this the right way to ensure pool shutdown?
    // shutdown the pool on process shutdown
    process.on('exit', function onExit() {
      log.verbose('received exit signal, closing pool');
      pool.end();
    });

    return pool;
  }
};
