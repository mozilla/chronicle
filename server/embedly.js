/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// Facade that abstracts the embed.ly endpoint.
// TODO use Joi to validate the url and ensure key is defined

var camelize = require('underscore.string').camelize;
var Embedly = require('embedly');

var config = require('./config');
var apiKey = config.get('embedly_apiKey');
var isEnabled = config.get('embedly_enabled');
var logFactory = require('./logger');
var log = logFactory('server.services.embedly');
var npmLog = logFactory('server.services.embedly.vendor');

module.exports = {
  extract: function extract(url, cb) {
    log.debug('embedly.extract called');

    if (!isEnabled) {
      return cb('Embedly is currently disabled. Set `embedly_enabled` to enable.');
    }
    if (!apiKey) {
      return cb('Embedly requires an API key. Set `embedly_apiKey` to enable.');
    }

    // node-embedly logs failures, so we can skip that here
    new Embedly({key: apiKey, logger: npmLog}, function(err, api) {
      if (err) { return cb(err); }
      api.extract({url:url}, function(err, data) {
        log.verbose('embedly.extract callback for url ' + url + ' returned data ' + JSON.stringify(data));
        if (err) { return cb(err); }
        var d = data && data[0];
        if (!d) { return cb(new Error('embedly response was empty for url ' + url)); }
        if (d.type === 'error') { return cb(new Error('embedly response was of type error for url ' + url)); }

        // by default, we are now going to keep everything in the format embedly sends us, except:

        // publication date handling:
        //
        // embedly expresses date of publication as 'published' + 'offset'.
        // these are both represented as milliseconds since the epoch.
        // if embedly found no publication time, 'published' + 'offset' will both be empty.
        // if embedly found publication time but no timezone, 'published' will be UTC.
        // if embedly found publication time and timezone, 'published' is in that
        // timezone, and 'offset' expresses the difference from UTC.
        // we transform these keys to store ISO dates, not millis, in our database.
        var publicationDateMillis = (d.offset || 0) + (d.published || 0);
        if (publicationDateMillis) {
          d.published = new Date(publicationDateMillis).toJSON();
          delete d.offset;
        }

        // not in the response, but we want extracted_at to be the current time
        d.extracted_at = new Date().toJSON();
        return cb(err, d);
      });
    });
  }
};

