/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Boom = require('boom');

var log = require('../logger')('server.controllers.search');

// hmm, should this just be a method on the visits controller?
var visits = require('../models/visits');
var searchView = require('../views/search');

var searchController = {
  get: function (request, reply) {
    var userId = request.auth.credentials;
    var searchTerm = request.query.q;
    var maxResults = request.query.count;
    visits.search(userId, searchTerm, maxResults, function (err, results) {
      var output;
      if (err) {
        log.warn(err);
        return reply(Boom.create(500));
      }
      if (results && results.results) {
        output = searchView.render(results);
      }
      reply(output || results);
    });
  }
};

module.exports = searchController;
