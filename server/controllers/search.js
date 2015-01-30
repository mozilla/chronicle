/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Boom = require('boom');

var config = require('../config');
var log = require('../logger')('server.controllers.search');
var url2png = require('url2png')(config.get('url2png.apiKey'), config.get('url2png.secretKey'));
var visits = require('../models/visits');

function addScreenshots(items) {
  // XXX this uses different keys than the visit and visits transforms
  items.forEach(function(item) {
    item._source.screenshot_url = url2png.buildURL(item._source.url, {viewport: '1024x683', thumbnail_max_width: 540});
  });
  return items;
}

var searchController = {
  get: function (request, reply) {
    var userId = request.auth.credentials;
    var searchTerm = request.query.q;
    var maxResults = request.query.count;
    visits.search(userId, searchTerm, maxResults, function (err, results) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500));
      }
      if (results && results.results) {
        addScreenshots(results.results.hits);
      }
      reply(results);
    });
  }
};

module.exports = searchController;
