/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');

var postgres = require('../db/postgres');
var log = require('../logger')('server.models.user');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var user = {
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    _verbose('onfulfilled results are: ' + JSON.stringify(results));
    callback(null, results);
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  create: function(userId, email, oauthToken, cb) {
    var name = 'models.user.create'; // RIP `arguments.callee` *snif*
    _verbose(name + ' called', userId, email, oauthToken);
    var query = 'INSERT INTO users (user_id, email, oauth_token, created_at, updated_at) ' +
                'VALUES ($1, $2, $3, $4, $4)';
    var params = [userId, email, oauthToken, new Date().toJSON()];
    postgres.query(query, params)
      .done(user._onFulfilled.bind(user, name + ' succeeded', cb),
            user._onRejected.bind(user, name + ' failed', cb));
  },
  // TODO TODO use this! :-)
  exists: function(userId, cb) {
    var name = 'models.user.exists';
    var query = 'SELECT exists(SELECT 1 FROM users WHERE user_id = $1)';
    postgres.query(query, [userId])
      .done(function(result) {
        user._onFulfilled(name + ' succeeded', cb, result.exists);
      },
      user._onRejected.bind(user, name + ' failed', cb));
  },
  get: function(userId, cb) {
    var name = 'models.user.get';
    _verbose(name + ' called', userId);
    var query = 'SELECT user_id, email FROM users WHERE user_id = $1';
    postgres.query(query, [userId])
      .done(user._onFulfilled.bind(user, name + ' succeeded', cb),
            user._onRejected.bind(user, name + ' failed', cb));
  },
  update: function(userId, email, oauthToken, cb) {
    var name = 'models.user.update';
    _verbose(name + ' called', userId, email, oauthToken);
    var query = 'UPDATE users SET email = $1, oauth_token = $2, updated_at = $3 ' +
                'WHERE user_id = $4 RETURNING email, user_id';
    postgres.query(query, [email, oauthToken, new Date().toJSON(), userId])
      .done(user._onFulfilled.bind(user, name + ' succeeded', cb),
            user._onRejected.bind(user, name + ' failed', cb));
  }
};

module.exports = user;
