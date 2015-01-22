/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('../../logger')('server.work-queue.jobs.extract-url');
var userPages = require('../../models').userPages;
var embedly = require('../../services/embedly');

module.exports = {
  // o is an object with keys { fxaId, url }
  perform: function(o) {
    log.verbose('job created with params ' + JSON.stringify(o));
    embedly.extract(o.url, function(err, data) {
      if (err) {
        // we should retry on failure. leave that to the queue.
        throw err;
      } else {
        // on success: create a new job in the um post-scraping-saving-data queue.
        // or, just ask the visit (er, I mean, user page?) to update itself with the data ^_^
        userPages.update(o.fxaId, data);
      }
    });
  }
};
