/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var path = require('path');
var Joi = require('joi');
var pg = require('pg');
var pgpatcher = require('pg-patcher');
var q = require('q');

var config = require('../config');
var log = require('../logger')('server.db.migrator');
var reindex = require('./reindex');

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
      pgpatcher(client, level, {dir: path.join(__dirname, 'migrations')}, function onPatched(err, result) {
        log.debug('pgpatcher callback fired');
        if (err) {
          log.error('pgpatcher migration failed: ' + err);
          done();
          pg.end();
          return deferred.reject(err);
        }
        log.info('pgpatcher migration succeeded');
        // at patchLevel 0 and 1, there is no user_pages table to reindex
        if (patchLevel < 2) {
          done();
          pg.end();
          return deferred.resolve(result);
        }
        reindex.start(function(err) {
          if (err) {
            log.error('elasticsearch reindexing failed: ' + err);
            done();
            pg.end();
            return deferred.reject(err);
          }
          log.info('elasticsearch reindexing succeeded');
          done();
          pg.end();
          deferred.resolve(result);
        });
      });
    }
  });
  return deferred.promise;
};

module.exports = migrator;
