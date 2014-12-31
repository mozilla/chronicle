/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var crypto = require('crypto');
var mysql = require('mysql');
var uuid = require('uuid');

var config = require('../config');
var log = require('../logger')('server.db.db');
var utils = require('./utils');

var pool = utils.createPool();

function _verbose(funcName, funcArgs) {
  var args = funcArgs && [].join.call(funcArgs, ', ');
  log.verbose(funcName + ' called. arguments are: ' + args);
}

// DB API uses callbacks for the moment; TODO return promises?
// TODO validate DB inputs from the API at some point
module.exports = {
  createUser: function(fxaId, email, oauthToken, cb) {
    _verbose('db.createUser', arguments);
    var query = 'INSERT INTO users (fxaId, email, oauthToken) ' +
                'VALUES (?, ?, ?)';
    pool.query(query, [fxaId, email, oauthToken], function(err) {
      if (err) {
        log.warn('error saving user: ' + err);
        // TODO send the item to a retry queue?
        return cb(err);
      }
      _verbose('db.createUser: created user');
      cb(err);
    });
  },
  getUserById: function(fxaId, cb) {
    _verbose('db.getUserById', arguments);
    var query = 'SELECT fxaId, email, oauthToken FROM users WHERE fxaId = ?';
    pool.query(query, fxaId, function(err, r) {
      if (err) {
        log.warn('error retrieving user: ' + err);
      }
      cb(err, r && r[0]);
    });
  },
  updateUser: function(fxaId, email, oauthToken, cb) {
    _verbose('db.updateUser', arguments);
    var query = 'UPDATE users SET email = ?, oauthToken = ? WHERE fxaId = ?';
    pool.query(query, [email, oauthToken, fxaId], function(err) {
      if (err) {
        log.warn('error updating user: ' + err);
        // TODO send the item to a retry queue?
        return cb(err);
      }
      _verbose('db.updateUser: updated user');
      cb(err);
    });
  },
  getPaginatedVisits: function(fxaId, visitId, count, cb) {
    _verbose('db.getPaginatedVisits', arguments);
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE fxaId = ? ' +
                'AND visitedAt < (SELECT visitedAt FROM visits WHERE id = ?) ' +
                'ORDER BY visitedAt DESC LIMIT ?';
    pool.query(query, [fxaId, visitId, count], function(err, results) {
      cb(err, results);
    });
  },
  getVisits: function(fxaId, count, cb) {
    _verbose('db.getVisits', arguments);
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE fxaId=? ORDER BY visitedAt DESC LIMIT ?';
    pool.query(query, [fxaId, count], function(err, results) {
      cb(err, results);
    });
  },
  getVisit: function(fxaId, visitId, cb) {
    _verbose('db.getVisit', arguments);
    // important: MySQL enforces that the user with id `fxaId` is the user with visit `visitId`
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE id = ? AND fxaId = ?';
    pool.query(query, [visitId, fxaId], function(err, r) {
      if (err) {
        log.warn('error getting visit: ' + err);
      }
      cb(err, r && r[0]);
    });
  },
  // TODO if the url and visitedAt are the same, should we just discard the record?
  // ...maybe just deal with it later
  createVisit: function(fxaId, visitId, visitedAt, url, title, cb) {
    _verbose('db.createVisit', arguments);
    var urlHash = crypto.createHash('sha1').update(url).digest('hex').toString();
    var query = 'INSERT INTO visits (id, fxaId, rawUrl, url, urlHash, title, visitedAt) ' +
                'VALUES (?, ?, ?, ?, ?, ?, ?)';
    pool.query(query, [visitId, fxaId, url, url, urlHash, title, visitedAt], function(err, results) {
      if (err) {
        log.warn('error creating visit: ' + err);
      }
      cb(err);
    });
  },
  updateVisit: function(fxaId, visitId, visitedAt, url, title, cb) {
    _verbose('db.updateVisit', arguments);
    var query = 'UPDATE visits SET visitedAt = ?, url = ?, urlHash = ?, rawUrl = ?, title = ? ' +
                'WHERE fxaId = ? AND id = ?';
    var urlHash = crypto.createHash('sha1').update(url).digest('hex').toString();
    pool.query(query, [visitedAt, url, urlHash, url, title, fxaId, visitId], function(err, r) {
      if (err) {
        log.warn('error updating visit: ' + err);
      }
      cb(err, r && r[0]);
    });
  },
  deleteVisit: function(fxaId, visitId, cb) {
    _verbose('db.updateVisit', arguments);
    var query = 'DELETE FROM visits WHERE fxaId = ? AND id = ?';
    pool.query(query, [fxaId, visitId], function(err) {
      if (err) {
        log.warn('error deleting visit: ' + err);
      }
      cb(err);
    });
  }
};

// TODO attach the pool to the hapi server
