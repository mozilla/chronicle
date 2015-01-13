/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// this script assumes you've run the create_db script.

'use strict';

var uuid = require('uuid');
var program = require('commander');

var createHash = require('crypto').createHash;
var config = require('../config');
var db = require('./db');
var log = require('../logger')('db.createTestUser');

var pool = require('./utils').createPool();

var defaultCount = 25;

// see bottom for initialization

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

  db.createUser(fakeUser.id, fakeUser.email, fakeUser.oauthToken, function(err) {
    if (err) { throw err; }
    log.verbose('inserted fake user into db');

    // instead of db.createVisit, we'll just issue a bulk insert query directly
    var query = 'INSERT INTO visits (id, visitedAt, fxaId, rawUrl, url, urlHash, title) ' +
                'VALUES ?';
    log.trace('about to insert bulk data');
    log.trace('query is: ' + query);
    log.trace('bulkData.length is ' + bulkData.length);
    pool.query(query, [bulkData], function(err) {
      if (err) { throw err; }
      log.verbose('inserted ' + bulkData.length + ' user visits into db');
      cb && cb(err);
    });
  });
}

// TODO replace this with a create_db call, since it drops the old DB along the way
function truncateTables(cb) {
  pool.getConnection(function(err, c) {
    if (err) {
      log.verbose('error getting connection: ' + err);
      return cb(err);
    }
    c.query('TRUNCATE visits', function(err) {
      if (err) {
        log.verbose('error truncating table: ' + err);
      } else {
        log.verbose('truncated visits table');
      }
      c.query('TRUNCATE users', function(err) {
        if (err) {
          log.verbose('error truncating tables: ' + err);
        } else {
          log.verbose('truncated users table');
        }
        c.release();
        cb && cb(err);
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
               '  that user, and saves it all in MySQL.')
  .option('-c, --count <n>', 'Number of fake records to generate. Defaults to ' + defaultCount + '.')
  .parse(process.argv);

var count = program.count || defaultCount;
truncateTables(function(err) {
  if (err) {
    throw err;
  }
  createTestUser.call(null, count, done);
});
