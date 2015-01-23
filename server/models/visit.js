/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');

var config = require('../config');
var postgres = require('../db/postgres');
var elasticsearch = require('../db/elasticsearch');
var log = require('../logger')('server.models.visit');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var visit = {
  // TODO switch to underscores in postgres + camelCase elsewhere.
  // move the translation bit into the postgres DBO.
  _normalize: function _normalize(r) {
    return {
      id: r.id,
      url: r.url,
      urlHash: r.urlhash,
      title: r.title,
      visitedAt: r.visitedat
    };
  },
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    callback(null, results && visit._normalize(results.rows[0]));
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  get: function(fxaId, visitId, cb) {
    var name = 'models.visit.get';
    _verbose(name + ' called', fxaId, visitId);
    // important: postgres enforces that the user with id `fxaId` is the user with visit `visitId`
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE id = $1 AND fxaId = $2';
    var params = [visitId, fxaId];
    postgres.query(query, params)
      .done(visit._onFulfilled.bind(visit, name + ' succeeded', cb),
            visit._onRejected.bind(visit, name + ' failed', cb));
  },
  create: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    var name = 'models.visit.create';
    _verbose(name + ' called', fxaId, visitId, visitedAt, url, title);
    var query = 'INSERT INTO visits (id, fxaId, rawUrl, url, urlHash, title, visitedAt) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7)';
    var params = [visitId, fxaId, url, url, urlHash, title, visitedAt];
    var esQuery = {
      index: 'chronicle',
      type: 'visits',
      id: visitId,
      body: {
        id: visitId,
        fxaId: fxaId,
        url: url,
        urlHash: urlHash,
        title: title,
        visitedAt: visitedAt
      }
    };
    // try to insert into pg; handle pg errors; insert into es; then we're done.
    // don't pass results to fulfillment callback, because they aren't used by the caller.
    postgres.query(query, params)
      .fail(visit._onRejected.bind(visit, name + ' postgres insert failed', cb))
      .then(elasticsearch.query('create', esQuery))
      .done(visit._onFulfilled.bind(visit, name + ' succeeded', cb, null),
            visit._onRejected.bind(visit, name + ' elasticsearch insert failed', cb));
  }
};

module.exports = visit;
