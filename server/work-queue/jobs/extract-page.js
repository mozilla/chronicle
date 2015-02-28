/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('../../logger')('server.work-queue.jobs.extract-page');
var userPage = require('../../models/user-page');
var embedly = require('../../embedly');
var embedlyEnabled = require('../../config').get('embedly_enabled');

module.exports = {
  work: function(queue) {
    queue.process('extractPage', 10, function(job, done) {
      var d = job.data;
      if (!embedlyEnabled) {
        var msg = 'embedly disabled; extract-page job returning immediately';
        log.warn(msg);
        return done(new Error(msg));
      }
      // check if userPage exists in the db already
      userPage.hasMetadata(d.userId, d.urlHash, function(err, pageExists) {
        if (err) {
          var msg = 'failed to check if page has metadata';
          log.warn(msg, err);
          return done(new Error(msg));
        } else if (pageExists) {
          log.info('page already has metadata, no need to scrape it', d.url);
          return done();
        }
        embedly.extract(d.url, function(err, extracted) {
          if (err) {
            var msg = 'failed at embedly.extract step';
            log.warn(msg, d.url);
            // we should retry on failure. leave that to the queue.
            return done(new Error(msg));
          }
          log.verbose('succeeded at embedly.extract step', d.url);
          // the visit creation job has probably created a record in the user_page table.
          // if not, update will lazily create it.
          userPage.update(d.userId, d.url, d.urlHash, d.title, extracted, function (err) {
            var msg;
            if (err) {
              msg = 'failed at userPage.update step';
              log.warn(msg, d.url);
              done(new Error(msg));
            }
            done();
          });
        });
      });
    });
  }
};
