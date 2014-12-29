/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// TODO extract schema into, you know, a schema file
// TODO figure out migrations story - mysql-patcher? node-migrate?

var mysql = require('mysql');
var config = require('../config');
var log = require('../logger')('server.db');

// TODO use connection pooling
var conn = mysql.createConnection({
  host: config.get('db.mysql.host'),
  user: config.get('db.mysql.user'),
  password: config.get('db.mysql.password')
});

function createDatabase(cb) {
  var dropDatabaseQuery = 'DROP DATABASE IF EXISTS chronicle';
  var createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS chronicle ' +
    'CHARACTER SET utf8 COLLATE utf8_unicode_ci';
  var useDatabaseQuery = 'USE chronicle';
  var createTableQuery = 'CREATE TABLE IF NOT EXISTS users (' +
    'fxa_id BINARY(16) NOT NULL PRIMARY KEY,' +
    'email VARCHAR(256) NOT NULL,' +
    'oauth_token VARCHAR(256),' +
    'createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'updatedAt TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,' +
    'INDEX (email)' +
    ') ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;';

  conn.connect(function (err) {
    if (err) {
      log.warn('error connecting to mysql: ' + err);
      return cb(err);
    }
    log.info('connected to mysql as id ' + conn.threadId);

    // TODO use promises for prettier chaining
    log.info('dropping any existing database');
    conn.query(dropDatabaseQuery, function (err) {
      if (err) {
        log.warn('error dropping database: ' + err);
        return cb(err);
      }
      log.info('old database dropped.');
      log.info('creating chronicle database');
      conn.query(createDatabaseQuery, function (err) {
        if (err) {
          log.warn('error creating database: ' + err);
          return cb(err);
        }
        log.info('database successfully created');
        conn.query(useDatabaseQuery, function (err) {
          if (err) {
            log.warn('error using database: ' + err);
            return cb(err);
          }
          log.info('now using database');

          log.info('creating user table');
          conn.query(createTableQuery, function (err) {
            if (err) {
              log.warn('error creating user table: ' + err);
              return cb(err);
            }
            log.info('user table successfully created');
            cb();
          });
        });
      });
    });
  });
}

createDatabase(function(err) {
  if (err) {
    log.warn('something went wrong: ' + err);
  } else {
    log.info('database created, exiting');
  }
});
