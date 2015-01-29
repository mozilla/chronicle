/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var visit = require('../../models/visit');
var log = require('../../logger')('server.work-queue.jobs.create-visit');

module.exports = {
  // o is an object with keys { userId, visitId, url, urlHash, title, visitedAt }
  perform: function(o, cb) {
    log.verbose('job created with params ' + JSON.stringify(o));
    visit.create(o.userId, o.visitId, o.visitedAt, o.url, o.urlHash, o.title, function (err) {
      log.verbose('inside the visit.create callback inside the createVisit job!');
      if (err) {
        log.warn('visit.create callback inside job says err: ' + err);
        // tell node-resque that the job failed
      }
      cb(err);
    });
  }
};
