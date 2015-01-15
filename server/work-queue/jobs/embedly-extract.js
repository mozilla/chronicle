/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Embedly = require('embedly');

var config = require('../../config');

var EMBEDLY_KEY = config.get('server.embedly.key');
var VALID_TYPES = {
  extract: 'extract',
  oembed: 'oembed'
};

module.exports = {
  EXTRACT: VALID_TYPES.extract,
  OEMBED: VALID_TYPES.oembed,

  /**
   * Extracts the specified page(s) contents using the Embed.ly API using either the Embedly `extract()` or `oembed()`
   * API.
   *
   * Usage:
   * 1. The `optionsOrUrl` attribute can be a URL as a string:
   *   EmbedlyWorker.perform('https://mozilla.com/', EmbedlyWorker.EXTRACT, function (err, results) {...});
   *
   * 2. The `optionsOrUrl` attribute can be an object containing a `url` argument:
   *   EmbedlyWorker.perform({url: 'https://mozilla.com/'}, EmbedlyWorker.OEMBED, function (err, results) {...});
   *
   * 3. The `optionsOrUrl` attribute can be an object containing a `urls` array argument (max 20 URLs):
   *   EmbedlyWorker.perform({urls: ['https://mozilla.com/']}, EmbedlyWorker.OEMBED, function (err, results) {...});
   *
   * @param {Object|String} optionsOrUrl A URL to a page to scrape, or an object containing a `url` or `urls` (Array)
   *                                     argument.
   * @param {String} type A String which specifies whether we should use the `extract()` or `oembed()` API. Valid values
   *                      are 'extract' or 'oembed'.
   * @param {Function} callback A callback function with the following signature: `function (err, results)` where
   *                            results is an Array of objects from the specified Embed.ly `type` API.
   */
  perform: function EmbedlyWorker(optionsOrUrl, type, callback) {
    // If `optionsOrUrl` is a string, wrap the URL in an object.
    if (typeof optionsOrUrl === 'string') {
      optionsOrUrl = {url: optionsOrUrl};
    }

    // If `type` wasn't specified and the callback function was specified as the second argument, set a default type.
    if (typeof type === 'function') {
      callback = type;
      type = VALID_TYPES.extract;
    }

    // Return error if `type` isn't a supported value.
    if (Object.keys(VALID_TYPES).indexOf(type) === -1) {
      var invalidTypeErr = new Error('Invalid type argument. Must be \'extract\' or \'oembed\'.');
      return callback(invalidTypeErr);
    }

    return new Embedly({key: EMBEDLY_KEY}, function(err, api) {
      if (err) {
        // Error creating Embedly api.
        return callback(err);
      }

      // `apiFunc` will be either `api.extract()` or `api.oembed()`.
      var apiFunc = api[type];

      apiFunc(optionsOrUrl, function (apiErr, results) {
        if (apiErr) {
          // Error scraping resource.
          return callback(apiErr);
        }

        // Success
        callback(null, results);
      });
    });
  }
};
