/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var nr = require('node-resque');
var config = require('../config');
var log = require('./logger')('server.work-queue');

// create a queue for each registered service
// retry queue for errors like network timeouts that might not indicate unreachable URL
// failed queue for stuff that failed multiple times, or that gives, eg, 401 or 404 error
// --> just log the job and the error message, that seems cleaner.
// --> if we want to analyze failures, we can do that later.

// what's v1? if it fails, log it as a failure and don't retry.

var jobs = {
  extract: require('services/embedly')
};

var connectionDetails = {
  host: config.get('db.redis.host'),
  password: config.get('db.redis.password'),
  port: config.get('db.redis.port'),
  database: config.get('db.redis.database')
};

var onQueueReady = function onQueueReady() { console.log('yay, queue ready'); };

var queue = new nr.queue({connection: connectionDetails}, jobs, onQueueReady);

// todo for v1: expose one function per job type, just an 'enqueue' function for each.
// or it could be queue.enqueue({job: 'extract', args: [...]});
// vs queue.extract(args) ? neither is great but getting there.
