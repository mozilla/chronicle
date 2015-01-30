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

    visit.exists(o.userId, o.visitedAt, o.urlHash, function (err, result) {
      if (err) {
        log.warn('failed at visit.exists step for visit url ' + o.url + ' :' + err);
        return cb(err);
      } else if (result.exists) {
        log.warn('duplicate visit submitted for url ' + o.url + ', aborting');
        return cb();
      }
      visit.create(o.userId, o.visitId, o.visitedAt, o.url, o.urlHash, o.title, function (err) {
        log.verbose('inside the visit.create callback inside the createVisit job!');
        if (err) {
          log.warn('failed at visit.create step for visit url ' + o.url + ' :' + err);
        }
        cb(err);
      });
    });
  }
};
