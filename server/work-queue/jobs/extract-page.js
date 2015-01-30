/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('../../logger')('server.work-queue.jobs.extract-page');
var userPage = require('../../models/user-page');
var embedly = require('../../embedly');

module.exports = {
  // o is an object with keys { userId, url, urlHash, title }
  perform: function(o, cb) {
    log.verbose('job created with params ' + JSON.stringify(o));
    // check if userPage exists in the db already
    userPage.hasMetadata(o.userId, o.urlHash, function(err, pageExists) {
      if (err) {
        log.warn('failed to check if page has metadata: ' + err);
        return cb(err);
      } else if (pageExists) {
        log.info('page already has metadata, not scraping url ' + o.url);
        // TODO does node-resque expect an error here? probably not?
        return cb(null);
      }
      embedly.extract(o.url, function(err, data) {
        if (err) {
          log.warn('failed at embedly.extract step for url ' + o.url + ': ' + err);
          // we should retry on failure. leave that to the queue.
          return cb(err);
        }
        log.verbose('succeeded at embedly.extract step for url ' + o.url + ': ' + JSON.stringify(data));
        // the visit creation job has probably created a record in the user_page table.
        // if not, update will lazily create it.
        userPage.update(o.userId, o.url, o.urlHash, o.title, data, function (err) {
          if (err) {
            log.warn('failed at userPage.update step for url ' + o.url + ': ' + err);
          } else {
            log.verbose('succeeded for url ' + o.url);
          }
          cb(err);
        });
      });
    });
  }
};

