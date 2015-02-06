/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var Joi = require('joi');
var pg = require('pg');
var pgpatcher = require('pg-patcher');
var q = require('q');

var config = require('../config');
var log = require('../logger')('server.db.migrator');
var elasticsearch = require('./elasticsearch.js');

var migrator = function (patchLevel) {
  log.debug('migrator called, patchLevel is ' + patchLevel);
  var deferred = q.defer();
  // Joi handles input validation and string -> int coercion for us
  var result = Joi.validate(patchLevel, Joi.number().integer().required());
  var level = result.value; 
  if (result.error) {
    log.error('migrator failed, arguments failed to validate: ' + result.error);
    deferred.reject(result.error);
    return deferred.promise;
  }

  var dbParams = {
    user: config.get('db_postgres_user'),
    password: config.get('db_postgres_password'),
    host: config.get('db_postgres_host'),
    port: config.get('db_postgres_port'),
    database: config.get('db_postgres_database'),
    ssl: config.get('db_postgres_ssl')
  };

  pg.connect(dbParams, function onConnect(err, client, done) {
    if (err) {
      log.warn('failed to connect to pg');
      log.trace(err);
      deferred.reject(err);
    } else {
      pgpatcher(client, level, {dir: __dirname + '/migrations'}, function onPatched(err, result) {
        log.debug('pgpatcher callback fired');
        // TODO: reindex elasticsearch by extracting user_pages from the migrated DB
        if (err) {
          log.error('pgpatcher migration failed: ' + err);
          done();
          pg.end();
          deferred.reject(err);
        } else {
          log.info('pgpatcher migration succeeded');
          done();
          pg.end();
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
};

module.exports = migrator;
