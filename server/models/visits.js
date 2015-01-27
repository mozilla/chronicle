/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var q = require('q');

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
    callback(null, results);
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  _transform: function _transform(results) {
    if (!results || !results.length) { return; }
    var transformed = [];
    results.forEach(function(result) {
      transformed.push(visit._transform(result));
    });
    return transformed;
  },
  getPaginated: function(fxaId, visitId, count, cb) {
    var name = 'models.visits.getPaginated';
    _verbose(name + ' invoked', fxaId, visitId, count);
    var query = 'SELECT visits.id as visit_id, visits.fxa_id as user_id, visits.visited_at, * ' +
                'FROM visits LEFT JOIN user_pages ON visits.user_page_id = user_pages.id ' +
                'WHERE fxa_id = $1 ' +
                'AND visits.visited_at < (SELECT visited_at FROM visits WHERE id = $2) ' +
                'ORDER BY visits.visited_at DESC LIMIT $3';
    var params = [fxaId, visitId, count];
    postgres.query(query, params)
      .then(function(results) {
        // return a promise that resolves to the transformed results
        return q(visits._transform(results));
      })
      .done(visits._onFulfilled.bind(visits, name + ' succeeded', cb),
            visits._onRejected.bind(visits, name + ' failed', cb));
  },
  get: function(fxaId, count, cb) {
    var name = 'models.visits.get';
    _verbose(name + ' invoked', fxaId, count);
    var query = 'SELECT visits.id as visit_id, visits.fxa_id as user_id, visits.visited_at, * ' +
                'FROM visits LEFT JOIN user_pages ON visits.user_page_id = user_pages.id ' +
                'WHERE visits.fxa_id = $1 ORDER BY visits.visited_at DESC LIMIT $2';
    var params = [fxaId, count];
    postgres.query(query, params)
      .then(function(results) {
        // return a promise that resolves to the transformed results
        return q(visits._transform(results));
      })
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
            // TODO should we just return __everything__ for now, until we figure out what's useful
            // on the front-end?
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
