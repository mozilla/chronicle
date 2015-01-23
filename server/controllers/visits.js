/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var crypto = require('crypto');
var Boom = require('boom');
var uuid = require('uuid');

var config = require('../config');
var log = require('../logger')('server.controllers.visits');
var queue = require('../work-queue/queue');
var visits = require('../models/visits');

// TODO: normalize URLs

var visitsController = {
  get: function (request, reply) {
    var userId = request.auth.credentials;
    var visitId = request.query.visitId;

    function onResults(err, results) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500)); // TODO distinguish between 4xx and 5xx?
      }
      reply(results);
    }

    // if there's a visitId provided, then we want a specific page
    if (visitId) {
      visits.getPaginated(userId, visitId, request.query.count, onResults);
    } else {
      visits.get(userId, request.query.count, onResults);
    }
  },
  // moving this into visits (plural) because we're going to support multiple 
  // uploads from this same endpoint
  // TODO handle multiple uploads :-)
  post: function(request, reply) {
    var p = request.payload;
    var userId = request.auth.credentials;
    var visitId = p.visitId || uuid.v4();
    var urlHash = crypto.createHash('sha1').update(p.url).digest('hex').toString();
    var o = {
      userId: userId,
      visitId: visitId,
      url: p.url,
      urlHash: urlHash,
      title: p.title,
      visitedAt: p.visitedAt
    };
    queue.createVisit(o);
    if (config.get('embedly.enabled')) {
      // extractPage doesn't need all these keys, but the extras won't hurt anything
      // XXX the extractPage job checks if the user_page has been scraped recently
      queue.extractPage(o);
    } else {
      log.info('not extracting page because embedly is disabled');
    }
    reply({
      id: visitId,
      url: p.url,
      urlHash: urlHash,
      title: p.title,
      visitedAt: p.visitedAt
    });
  }
};

module.exports = visitsController;
