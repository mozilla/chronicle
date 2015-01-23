/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var pg = require('pg');
var Q = require('q');

var config = require('../config');
var log = require('../logger')('server.db.postgres');

var dbParams = {
  user: config.get('db.postgres.user'),
  password: config.get('db.postgres.password'),
  host: config.get('db.postgres.host'),
  port: config.get('db.postgres.port'),
  database: config.get('db.postgres.database'),
  ssl: config.get('db.postgres.ssl')
};

// primitive DB object
var postgres = {
  timeout: config.get('db.postgres.queryTimeout'),
  // query postgres; returns a promise
  //
  // query := a prepared query string
  // params := an array of the query params in correct order
  query: function query(query, params) {
    var _defer = Q.defer();
    // force promises to eventually resolve
    _defer.promise = _defer.promise.timeout(postgres.timeout, 'postgres query timed out');
    pg.connect(dbParams, function onConnect(err, client, done) {
      if (err) { 
        log.warn('failed to connect to pg');
        log.trace(err);
        return _defer.reject(err);
      }
      client.query(query, params, function onQueryResponse(err, results) {
        if (err) {
          log.warn('postgres query failed');
          log.trace(err);
          return _defer.reject(err);
        }
        done();
        // individual models know how to normalize / transform the result.
        // in general, we seem to be safe to always just return rows.
        _defer.resolve(results && results.rows);
      });
    });
    return _defer.promise;
  }
};

module.exports = postgres;
