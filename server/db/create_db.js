/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// TODO extract schema into, you know, a schema file
// TODO figure out migrations story - mysql-patcher? node-migrate?
// TODO normalize URLs and store in visits 'url' field
// TODO add to visits when addon supports it: referrer, searchTerms, engagementTime

var program = require('commander');
var utils = require('./utils');
var config = require('../config');
var log = require('../logger')('server.db');

var pool = utils.createPool(true);

function createDatabase(cb) {
  var dropDatabaseQuery = 'DROP DATABASE IF EXISTS chronicle';
  var createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS chronicle ' +
    'CHARACTER SET utf8 COLLATE utf8_unicode_ci';
  var useDatabaseQuery = 'USE chronicle';
  var createUsersTableQuery = 'CREATE TABLE IF NOT EXISTS users (' +
    'fxaId CHAR(32) NOT NULL PRIMARY KEY,' +
    'email VARCHAR(256) NOT NULL,' +
    'oauthToken VARCHAR(256),' +
    'createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,' +
    'INDEX (email)' +
    ') ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;';
  var createVisitsTableQuery = 'CREATE TABLE IF NOT EXISTS visits (' +
    'id CHAR(36) NOT NULL PRIMARY KEY,' +
    'fxaId CHAR(32) NOT NULL,' +
    'url TEXT NOT NULL,' +
    'rawUrl TEXT NOT NULL,' +
    'urlHash CHAR(40) NOT NULL,' +
    'title VARCHAR(128) NOT NULL,' +
    'visitedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),' +
    'updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,' +
    'INDEX fxaId_visitedAt_id (fxaId, visitedAt, id)' +
    ') ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;';

  pool.getConnection(function(err, conn) {
    // TODO use promises for prettier chaining
    log.verbose('dropping any existing database');
    conn.query(dropDatabaseQuery, function (err) {
      if (err) {
        log.warn('error dropping database: ' + err);
        return cb(err);
      }
      log.verbose('old database dropped.');
      log.verbose('creating chronicle database');
      conn.query(createDatabaseQuery, function (err) {
        if (err) {
          log.warn('error creating database: ' + err);
          return cb(err);
        }
        log.verbose('database successfully created');
        conn.query(useDatabaseQuery, function (err) {
          if (err) {
            log.warn('error using database: ' + err);
            return cb(err);
          }
          log.verbose('now using database');

          log.verbose('creating user table');
          conn.query(createUsersTableQuery, function (err) {
            if (err) {
              log.warn('error creating user table: ' + err);
              return cb(err);
            }
            log.verbose('user table successfully created');
            conn.query(createVisitsTableQuery, function (err) {
              if (err) {
                log.warn('error creating visits table: ' + err);
                return cb(err);
              }
              log.verbose('visits table successfully created');
              pool.end();
              cb();
            });
          });
        });
      });
    });
  });
}

// kind of a no-op for now, but it's uniform relative to the other script
program
  .description('This script drops and re-creates the Chronicle database.\n' +
               '  Not necessarily intended for production use.')
  .parse(process.argv);

createDatabase(function(err) {
  if (err) {
    log.warn('something went wrong: ' + err);
  } else {
    log.verbose('database created, exiting');
  }
});
