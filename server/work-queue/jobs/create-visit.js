/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var visit = require('../../models/visit');
var log = require('../../logger')('server.work-queue.jobs.create-visit');

// for now, just pass around the queue reference
module.exports = {
  work: function(queue) {
    queue.process('createVisit', 10, function(job, done) {
      var d = job.data;
      log.info('createVisit.job.running', job.id);
      visit.create(d.userId, d.visitId, d.visitedAt, d.url, d.urlHash, d.title, function(err) {
        return done(err);
      });
    });
  }
};
