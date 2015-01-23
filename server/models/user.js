/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');

var config = require('../config');
var postgres = require('../db/postgres');
var log = require('../logger')('server.models.user');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var user = {
  // TODO switch to underscores in postgres + camelCase elsewhere.
  // move the translation bit into the postgres DBO.
  _normalize: function _normalize(r) {
    return {
      fxaId: r.fxaid,
      email: r.email
    };
  },
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    callback(null, results && user._normalize(results.rows[0]));
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  create: function(fxaId, email, oauthToken, cb) {
    var name = 'models.user.create'; // RIP `arguments.callee` *snif*
    _verbose(name + ' called', fxaId, email, oauthToken);
    var query = 'INSERT INTO users (fxaId, email, oauthToken, createdAt) ' +
                'VALUES ($1, $2, $3, $4)';
    var params = [fxaId, email, oauthToken, new Date().toJSON()];
    postgres.query(query, params)
      .done(user._onFulfilled.bind(user, name + ' succeeded', cb),
            user._onRejected.bind(user, name + ' failed', cb));
  },
  get: function(fxaId, cb) {
    var name = 'models.user.get';
    _verbose(name + ' called', fxaId);
    var query = 'SELECT fxaId, email FROM users WHERE fxaId = $1';
    postgres.query(query, [fxaId])
      .done(user._onFulfilled.bind(user, name + ' succeeded', cb),
            user._onRejected.bind(user, name + ' failed', cb));
  },
  update: function(fxaId, email, oauthToken, cb) {
    var name = 'models.user.update';
    _verbose(name + ' called', fxaId, email, oauthToken);
    var query = 'UPDATE users SET email = $1, oauthToken = $2, updatedAt = $3 ' +
                'WHERE fxaId = $4 RETURNING email, fxaId';
    postgres.query(query, [email, oauthToken, new Date().toJSON(), fxaId])
      .done(user._onFulfilled.bind(user, name + ' succeeded', cb),
            user._onRejected.bind(user, name + ' failed', cb));
  }
};

module.exports = user;
