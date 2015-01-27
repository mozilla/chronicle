/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// Facade that abstracts the embed.ly endpoint.
// TODO use Joi to validate the url and ensure key is defined

var camelize = require('underscore.string').camelize;
var Embedly = require('embedly');

var apiKey = require('./config').get('embedlyKey');
var logFactory = require('./logger');
var log = logFactory('server.services.embedly');
var npmLog = logFactory('server.services.embedly.vendor');

module.exports = {
  extract: function extract(url, cb) {
    log.debug('embedly.extract called');

    // node-embedly logs failures, so we can skip that here
    new Embedly({key: apiKey, logger: npmLog}, function(err, api) {
      if (err) { return cb(err); }
      api.extract({url:url}, function(err, data) {
        if (err) { return cb(err); }

        // for right now, let's just return the keys we want in user_pages
        var out = {};

        // these keys are top-level and match the format in the database
        var easyKeys = [
          'cache_age', 'content', 'description', 'favicon_url', 'language', 'lead',
          'offset', 'provider_display', 'provider_name', 'provider_url', 'published',
          'safe', 'title', 'type', 'url'
        ];
        easyKeys.forEach(function(item) {
          if (item in data) {
            out[camelize('extracted_' + item)] = data[item];
          }
        });

        // not in the response, but we want extracted_at to be the current time
        out.extractedAt = new Date().toJSON();

        if (data[0].authors.length) {
          out.extractedAuthorName = data[0].authors[0].name;
          out.extractedAuthorUrl = data[0].authors[0].url;
        }

        if (data[0].embeds.length) {
          out.extractedEmbedHtml = data[0].embed.html;
          out.extractedEmbedWidth = data[0].embed.width;
          out.extractedEmbedHeight = data[0].embed.height;
        }

        // this is an array of r,g,b values, eg [181, 187, 194]
        out.extractedFaviconColor = data[0].favicon_colors[0].color;

        if (data[0].images.length) {
          out.extractedImageUrl = data[0].images[0].url;
          out.extractedImageWidth = data[0].images[0].width;
          out.extractedImageHeight = data[0].images[0].height;
          out.extractedImageEntropy = data[0].images[0].entropy;
          out.extractedImageCaption = data[0].images[0].caption;
          // another array of rgb values
          out.extractedImageColor = data[0].images[0].colors[0].color;
        }

        if (data[0].media.type) {
          out.extractedMediaType = data[0].media.type;
          out.extractedMediaHtml = data[0].media.html;
          out.extractedMediaHeight = data[0].media.height;
          out.extractedMediaWidth = data[0].media.width;
          out.extractedMediaDuration = data[0].media.duration;
        }

        return cb(err, out);
      });
    });
  }
};

