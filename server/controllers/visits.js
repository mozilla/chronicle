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
var visitsView = require('../views/visits');

var visitsController = {
  get: function (request, reply) {
    var userId = request.auth.credentials;
    var visitId = request.query.visitId;

    function onResults(err, results) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500)); // TODO distinguish between 4xx and 5xx?
      }
      if (!results) {
        return reply(Boom.create(404)); // not found
      }
      // for each visit in results, add the screenshot url
      reply(visitsView.render(results));
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
  post: function(request, reply) {
    var p = request.payload;
    var userId = request.auth.credentials;

    var created = visitsController._create(userId, p.url, p.title, p.visitedAt, p.visitId);
    reply(visitsView.render(created));
  },
  bulk: function(request, reply) {
    var priority = request.payload.priority;
    var userId = request.auth.credentials;
    var bulkVisits = request.payload.visits;
    if (!Array.isArray(bulkVisits)) { bulkVisits = [bulkVisits]; }
    var bulkResponse = [];
    var visit;
    bulkVisits.forEach(function(v) {
      visit = visitsController._create(userId, v.url, v.title, v.visitedAt, v.visitId, priority);
      bulkResponse.push(visit);
    });
    reply(bulkResponse);
  },
  _create: function(userId, url, title, visitedAt, visitId, priority) {
    visitId = visitId || uuid.v4();
    priority = priority || 'regular';
    var urlHash = crypto.createHash('sha1').update(url).digest('hex').toString();
    var data = {
      userId: userId,
      id: visitId,
      url: url,
      urlHash: urlHash,
      title: title,
      visitedAt: visitedAt
    };
    queue.createVisit({ priority: priority, data: data });
    if (config.get('embedly_enabled')) {
      // extractPage doesn't need all these keys, but the extras won't hurt anything
      // XXX the extractPage job checks if the user_page has been scraped recently
      queue.extractPage({ priority: priority, data: data });
    } else {
      log.info('not extracting page because embedly is disabled');
    }
    // return the visit, except for the userId
    delete data.userId;
    return data;
  }
};

module.exports = visitsController;
