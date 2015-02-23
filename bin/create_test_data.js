#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// this script assumes you've run the create_db script.

'use strict';

var config = require('../server/config');

// doing this above the other requires to avoid starting the queue unnecessarily
// TODO properly shut down the queue so we don't have to do dumb stuff like this
if (!config.get('testUser_enabled')) {
  throw new Error('To create test data, you must set testUser.enabled in the config.');
}

var log = require('../server/logger')('bin.createTestData');
var user = require('../server/models/user');
var visitsController = require('../server/controllers/visits');
var testUrls = require('../config/test-urls');

var HOURS_IN_MS = 1000 * 60 * 60;

function createTestUser(cb) {
  var fakeUser = {
    id: config.get('testUser_id'),
    email: config.get('testUser_email'),
    oauthToken: 'fakeOauthToken'
  };
  log.verbose('fakeUser is ' + JSON.stringify(fakeUser));
  user.create(fakeUser.id, fakeUser.email, fakeUser.oauthToken, function(err) {
    return cb && cb(err);
  });
}

function createTestData(cb) {
  var userId = config.get('testUser_id');
  // we'll use this date as a starting point for generating records. Each successive
  // record will be a number of hours in the future.
  var historyDate = new Date('2015-01-01T21:26:23.795Z');

  function generateTestRequest(item, n) {
    return {
      auth: {
        credentials: userId
      },
      payload: {
        url: item.url,
        title: item.title,
        visitedAt: new Date(historyDate.getTime() + (5 * HOURS_IN_MS * n)).toJSON()
      }
    };
  }

  testUrls.forEach(function(item, i) {
    log.verbose(i, item);
    visitsController.post(generateTestRequest(item, i), function(resp) {
      if (resp instanceof Error) {
        log.warn('visit creation failed: ' + JSON.stringify(resp));
      } else {
        log.verbose('visit creation success: ' + JSON.stringify(resp));
      }
    });
  });

  // for now, just wait 30 seconds, then fire the callback blindly
  setTimeout(function() {
    cb(null, '30 seconds is up, hopefully the scraper jobs are all done!');
    process.exit();
  }, 1000 * 30);
}

log.verbose('about to call createTestUser');
createTestUser(function (err) {
  log.verbose('inside createTestUser callback');
  if (err) {
    log.warn(err);
    log.warn('createTestUser failed, quitting');
    return process.exit();
  }
  log.verbose('about to call createTestData');
  createTestData(function(err) {
    log.verbose('inside createTestData callback');
    if (err) {
      log.warn(err);
      log.warn('createTestData failed');
    } else {
      log.verbose('should now exit; done invoked');
    }
    process.exit();
  });
});
