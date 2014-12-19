/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var mysql = require('mysql');
var config = require('../config');
var buf = require('buf').hex;
var log = require('../logger')('server.db');

var pool = mysql.createPool({
  connectionLimit: config.get('db.mysql.connectionLimit'),
  host: config.get('db.mysql.host'),
  user: config.get('db.mysql.user'),
  password: config.get('db.mysql.password'),
  database: config.get('db.mysql.database')
});

function _getConn(cb) {
  pool.getConnection(function(err, conn) {
    if (err) {
      log.warn('error getting connection from pool: ' + err);
      return cb(err);
    }
    cb(null, conn);
  });
}

// DB API uses callbacks for the moment; TODO return promises?
module.exports = {
  createUser: function(fxaId, email, oauthToken, cb) {
    var query = 'INSERT INTO users (fxa_id, email, oauth_token) ' + 
                'VALUES (?, ?, ?)' +
                'ON DUPLICATE KEY UPDATE ' +
                'fxa_id = VALUES(fxa_id), ' +
                'email = VALUES(email), ' +
                'oauth_token = VALUES(oauth_token)';
    _getConn(function(err, conn) {
      // TODO do we even want to handle pool connection errors here?
      if (err) {
        return cb(err);
      }
      conn.query(query, [buf(fxaId), email, oauthToken], function(err) {
        if (err) {
          log.warn('error saving user: ' + err);
          // TODO send the item to a retry queue?
        }
        conn.release();
        cb(err);
      });
    });
  },
  getUserById: function(fxaId, cb) {
    var query = 'SELECT email, oauth_token FROM users WHERE fxa_id = ?';
    _getConn(function(err, conn) {
      // TODO handle conn err?
      conn.query(query, buf(fxaId), function(err, result) {
        if (err) {
          log.warn('error retrieving user: ' + err);
        }
        conn.release();

        cb(err, result);
      });
    });
  }
};

// TODO attach the pool to the hapi server
// TODO on hapi shutdown, close the pool
