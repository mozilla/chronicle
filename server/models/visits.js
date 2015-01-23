/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');

var config = require('../config');
var postgres = require('../db/postgres');
var elasticsearch = require('../db/elasticsearch');
var log = require('../logger')('server.models.visits');
var visit = require('./visit');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var visits = {
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    callback(null, results && visits._normalize(results.rows));
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  getPaginated: function(fxaId, visitId, count, cb) {
    var name = 'models.visits.getPaginated';
    _verbose(name + ' invoked', fxaId, visitId, count);
    var query = 'SELECT id, url, url_hash, title, visited_at ' +
                'FROM visits WHERE fxa_id = $1 ' +
                'AND visited_at < (SELECT visited_at FROM visits WHERE id = $2) ' +
                'ORDER BY visited_at DESC LIMIT $3';
    var params = [fxaId, visitId, count];
    postgres.query(query, params)
      .done(visits._onFulfilled.bind(visits, name + ' succeeded', cb),
            visits._onRejected.bind(visits, name + ' failed', cb));
  },
  get: function(fxaId, count, cb) {
    var name = 'models.visits.get';
    _verbose(name + ' invoked', fxaId, count);
    var query = 'SELECT id, url, url_hash, title, visited_at ' +
                'FROM visits WHERE fxa_id = $1 ORDER BY visited_at DESC LIMIT $2';
    var params = [fxaId, count];
    postgres.query(query, params)
      .done(visits._onFulfilled.bind(visits, name + ' succeeded', cb),
            visits._onRejected.bind(visits, name + ' failed', cb));
  },
  search: function(fxaId, searchTerm, count, cb) {
    var name = 'models.visits.search';
    _verbose(name + ' invoked', fxaId, count);
    var esQuery = {
      index: 'chronicle',
      type: 'visits',
      size: count,
      body: {
        query: {
          bool: {
            must: {term: {fxaId: fxaId}},
            should: {term: {title: searchTerm}}
          }
        }
      }
    };
    elasticsearch.query('search', esQuery)
      .done(function(resp) {
        var output = {};
        output.resultCount = resp.hits.total;
        if (!!resp.hits.total) {
          output.results = resp.hits.hits.map(function(item) {
            // TODO: this is quite similar to the visit._normalize function,
            // except for downcasing. what's the cleanest way to formalize the
            // contract between API layers and these 2 databases? it should lead
            // naturally to API docs, I'd think.
            // TODO we might also want to return relevance scores or other special
            // elasticsearch bits as part of this API
            var s = item._source;
            return {
              id: s.id,
              fxaId: s.fxaId,
              title: s.title,
              url: s.url,
              urlHash: s.urlHash,
              visitedAt: s.visitedAt
            };
          });
        }
        _verbose(name + ' succeeded');
        cb(null, output);
      }, visits._onRejected.bind(visits, name + ' failed', cb));
  }
};

module.exports = visits;
