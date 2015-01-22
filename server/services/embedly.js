/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// Facade that abstracts the embed.ly endpoint.
// TODO use Joi to validate the url and ensure key is defined

var Embedly = require('embedly');
var apiKey = require('../config').get('embedlyKey');
var logFactory = require('../logger');
var log = logFactory('server.services.embedly');
var npmLog = logFactory('server.services.embedly.vendor');

module.exports = {
  extract: function extract(url, cb) {
    log.debug('embedly.extract called');

    // node-embedly logs failures, so we can skip that here
    new Embedly({key: apiKey, logger: npmLog}, function(err, api) {
      if (err) { return cb(err); }
      api.extract({url:url}, function(err, data) {
        return cb(err, data);
      });
    });
  }
};
