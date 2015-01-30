/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var pg = require('pg');
var Q = require('q');
var camelize = require('underscore.string').camelize;

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
  // postgres is case-insensitive, so we store keys as underscored there,
  // and transform back to camelCase when returning results here.
  // individual queries must be sure to use the underscored versions.
  camelize: function(rows) {
    var outputRows = [];
    var output;
    rows.forEach(function(row) {
      output = {};
      Object.keys(row).forEach(function(k) {
        output[camelize(k)] = row[k];
      });
      outputRows.push(output);
    });
    return outputRows;
  },
  // query postgres; returns a promise
  //
  // query := a prepared query string
  // params := an array of the query params in correct order
  query: function query(query, params) {
    var _defer = Q.defer();
    var formatted;
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
        // transform the underscored keys to camelcased before returning.
        if (results && results.rows.length) {
          formatted = postgres.camelize(results.rows);
        }
        // if it's a single thing, just return the single thing.
        if (formatted && formatted.length === 1) {
          formatted = formatted[0];
        }
        _defer.resolve(formatted);
      });
    });
    return _defer.promise;
  }
};

module.exports = postgres;
