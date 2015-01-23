/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// Facade that abstracts the embed.ly endpoint.
// TODO use Joi to validate the url and ensure key is defined

var camelize = require('underscore.string').camelize;
var Embedly = require('embedly');

var config = require('./config');
var apiKey = config.get('embedly.apiKey');
var isEnabled = config.get('embedly.enabled');
var logFactory = require('./logger');
var log = logFactory('server.services.embedly');
var npmLog = logFactory('server.services.embedly.vendor');

module.exports = {
  extract: function extract(url, cb) {
    log.debug('embedly.extract called');

    if (!isEnabled) {
      return cb('Embedly is currently disabled. Set `embedly.enabled` to enable.');
    }
    if (!apiKey) {
      return cb('Embedly requires an API key. Set `embedly.apiKey` to enable.');
    }

    // node-embedly logs failures, so we can skip that here
    new Embedly({key: apiKey, logger: npmLog}, function(err, api) {
      if (err) { return cb(err); }
      api.extract({url:url}, function(err, data) {
        log.verbose('embedly.extract callback for url ' + url + ' returned data ' + JSON.stringify(data));
        if (err) { return cb(err); }
        var d = data && data[0];
        if (!d) { return cb(new Error('embedly response was empty for url ' + url)); }

        // for right now, let's just return the keys we want in user_pages
        var out = {};

        // these keys are top-level and match the format in the database
        var easyKeys = [
          'cache_age', 'content', 'description', 'favicon_url', 'language', 'lead',
          'provider_display', 'provider_name', 'provider_url', 'safe', 'title', 'type', 'url'
        ];
        easyKeys.forEach(function(item) {
          if (item in d) {
            out[camelize('extracted_' + item)] = d[item];
          }
        });

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
          out.extractedPublished = new Date(publicationDateMillis).toJSON();
        }

        // not in the response, but we want extracted_at to be the current time
        out.extractedAt = new Date().toJSON();

        if (d.authors && d.authors.length) {
          out.extractedAuthorName = d.authors[0].name;
          out.extractedAuthorUrl = d.authors[0].url;
        }

        if (d.embeds && d.embeds.length) {
          out.extractedEmbedHtml = d.embed.html;
          out.extractedEmbedWidth = d.embed.width;
          out.extractedEmbedHeight = d.embed.height;
        }

        if (d.favicon_colors && d.favicon_colors.length) {
          // this is an array of r,g,b values, eg [181, 187, 194]
          out.extractedFaviconColor = d.favicon_colors[0].color;
        }

        if (d.images && d.images.length) {
          out.extractedImageUrl = d.images[0].url;
          out.extractedImageWidth = d.images[0].width;
          out.extractedImageHeight = d.images[0].height;
          out.extractedImageEntropy = d.images[0].entropy;
          out.extractedImageCaption = d.images[0].caption;
          // another array of rgb values
          if (d.images.colors) {
            out.extractedImageColor = d.images[0].colors[0].color;
          }
        }

        if (d.media && d.media.type) {
          out.extractedMediaType = d.media.type;
          out.extractedMediaHtml = d.media.html;
          out.extractedMediaHeight = d.media.height;
          out.extractedMediaWidth = d.media.width;
          out.extractedMediaDuration = d.media.duration;
        }

        return cb(err, out);
      });
    });
  }
};

