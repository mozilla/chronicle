/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('../../logger')('server.work-queue.jobs.extract-url');
var userPage = require('../../models/user-page');
var embedly = require('../../embedly');

module.exports = {
  // o is an object with keys { userId, url, urlHash, title }
  perform: function(o, cb) {
    log.verbose('job created with params ' + JSON.stringify(o));
    embedly.extract(o.url, function(err, data) {
      if (err) {
        log.warn('job failed, throwing to trigger a retry');
        // we should retry on failure. leave that to the queue.
        throw err;
      } else {
        log.verbose('extract-page job succeeded for user ' + o.userId + ', url ' + o.url + ': ' + JSON.stringify(data));
        // the visit creation job has probably created a record in the user_page table.
        // if not, update will lazily create it.
        userPage.update(o.userId, o.url, o.urlHash, o.title, data, function (err) {
          if (err) {
            log.warn('userPage.update failed: ' + err);
            throw err;
          }
          log.verbose('userPage.update succeeded');
          cb(null); // TODO is this right?
        });
      }
    });
  }
};

