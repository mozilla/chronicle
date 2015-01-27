#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// this script assumes you've run the create_db script.

'use strict';

var uuid = require('uuid');
var program = require('commander');
var pg = require('pg');

var createHash = require('crypto').createHash;
var config = require('../server/config');
var user = require('../server/models/user');
var log = require('../server/logger')('bin.createTestData');

var defaultCount = 25;

// see bottom for initialization

var dbParams = {
  user: config.get('db.postgres.user'),
  password: config.get('db.postgres.password'),
  host: config.get('db.postgres.host'),
  port: config.get('db.postgres.port'),
  database: config.get('db.postgres.database'),
  ssl: config.get('db.postgres.ssl')
};

function done() {
  log.verbose('should now exit; done invoked');
  process.exit();
}

function createTestUser(recordCount, cb) {
  recordCount = recordCount || defaultCount;

  var bulkData = [];

  // we'll use this date as a starting point for generating records. Each successive
  // record will be a number of seconds in the future.
  var historyDate = new Date('2015-01-01T21:26:23.795Z');

  var fakeUser = {
    id: config.get('testUser.id'),
    email: config.get('testUser.email'),
    oauthToken: 'fakeOauthToken'
  };
  log.verbose('fakeUser is ' + JSON.stringify(fakeUser));

  function generateTestRecord(n) {
    var visitedAt = new Date(historyDate.getTime() + (1000 * n)).toJSON();
    var title = 'Title for Page Number ' + n;
    var url = 'https://www.record' + n + '.com/whatever';
    var urlHash = createHash('sha1').update(url).digest('hex').toString();
    // in order: visitId, visitedAt, fxaId, rawUrl, url, urlHash, title
    var output = [uuid.v4(), visitedAt, fakeUser.id, url, url, urlHash, title];
    log.trace('generateTestRecord output is: ' + JSON.stringify(output));
    return output;
  }

  // TODO when we start generating large test data sets, stream it in
  for (var j = 0; j < recordCount; j++) {
    log.trace('pushing a record onto bulkData');
    bulkData.push(generateTestRecord(j));
  }

  user.create(fakeUser.id, fakeUser.email, fakeUser.oauthToken, function(err) {
    if (err) {
      return cb && cb(err);
    }
    pg.connect(dbParams, function(err, client, done) {
      function donezo(str, err) {
        if (str) { log.warn(str); }
        if (err) { log.trace(err); }
        done();
        pg.end();
        cb && cb(err);
      }

      if (err) {
        return donezo('failed to connect to database', err);
      }

      // instead of db.createVisit, we'll just issue a bulk insert query directly
      var query = 'INSERT INTO visits (id, visitedAt, fxaId, rawUrl, url, urlHash, title) VALUES ';
      // a micro query builder. turns arrays into quoted items enclosed in parens, comma-separated.
      // for example, [foo, 1], [bar, 2] => "('foo', '1'), ('bar', '2')"
      while (bulkData.length) {
        var next = bulkData.shift();
        query += '(' + next.map(function(item) { return '\'' + item + '\''; }).join(', ') + ')';
        if (bulkData.length) { query += ', '; }
      }
      log.trace('query is: ' + query);
      client.query(query, function(err) {
        var msg = err ? 'failed to create test data' :
          'inserted ' + recordCount + ' user visits into db';
        donezo(msg, err);
      });
    });
  });
}

// initialization: check we have configs, handle argv

if (!config.get('testUser.enabled')) {
  throw new Error('To create test data, you must set testUser.enabled in the config.');
}

program
  .description('This script wipes the user and visit tables, generates a fake user\n' +
               '  based on the `testUser` config value, generates N fake visits for\n' +
               '  that user, and saves it all in Postgres.')
  .option('-c, --count <n>', 'Number of fake records to generate. Defaults to ' + defaultCount + '.')
  .parse(process.argv);

createTestUser(program.count, done);
