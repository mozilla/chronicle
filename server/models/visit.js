/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');
var uuid = require('uuid');

var postgres = require('../db/postgres');
var elasticsearch = require('../db/elasticsearch');
var log = require('../logger')('server.models.visit');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var visit = {
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    callback(null, results && results.rows[0]);
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  // 1. find a complex way to combine both queries on the DB side
  // 2. (simpler) perform two simple queries and roll them together here
  get: function(fxaId, visitId, cb) {
    var name = 'models.visit.get';
    _verbose(name + ' called', fxaId, visitId);
    // it's actually way simpler to SELECT *, and re-select additional columns,
    // vs enumerating everything just to avoid two 'id's in the results.
    var query = 'SELECT *, visits.fxa_id as user_id ' +
    'FROM visits LEFT JOIN user_pages ON visits.user_page_id = user_pages.id ' +
    'WHERE visits.id = $1 AND visits.fxa_id = $2';
    var params = [visitId, fxaId];
    postgres.query(query, params)
      .done(visit._onFulfilled.bind(visit, name + ' succeeded', cb),
            visit._onRejected.bind(visit, name + ' failed', cb));
  },
  create: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    // XXX we create only a few user_page fields synchronously; the rest
    // are filled in async by the scraper worker
    var name = 'models.visit.create';
    _verbose(name + ' called', fxaId, visitId, visitedAt, url, title);
    // create the user_page if it doesn't exist, and return the user_page id
    // whether or not you just created it
    var lazyCreateUserPageQuery =
      'WITH new_page AS (  ' +
      '  INSERT INTO user_pages (id, user_id, url, raw_url, url_hash, title, created_at, updated_at) ' +
      '  SELECT $1, $2, $3, $3, $4, $5, $6, $6 ' +
      '  WHERE NOT EXISTS (SELECT id FROM user_pages WHERE user_id = $2 AND url_hash = $4) ' +
      '  RETURNING id ' +
      ') SELECT id FROM new_page ' +
      'UNION SELECT id FROM user_pages WHERE user_id = $2 AND url_hash = $4';
    var lazyCreateParams = [uuid.v4(), fxaId, url, urlHash, title, new Date().toJSON()];
    var createVisitQuery = 'INSERT INTO visits ' +
      '(id, fxa_id, user_page_id, visited_at, updated_at) ' +
      'VALUES ($1, $2, $3, $4, $4)';
    var userPageId;

    // TODO NEXT: fixup the es query. include userPageId.
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
    postgres.query(lazyCreateUserPageQuery, lazyCreateParams)
      .fail(visit._onRejected.bind(visit, name + ' failed', cb))
      .then(function(results) {
        // TODO will userPageId be correct? find out :-P
        userPageId = results && results.id;
        var visitParams = [visitId, fxaId, userPageId, visitedAt];
        // return the new query's promise to avoid nesting promise chains
        return postgres.query(createVisitQuery, visitParams);
      })
      .fail(visit._onRejected.bind(visit, name + ' postgres insert failed', cb))
      .then(elasticsearch.query('create', esQuery))
      .done(visit._onFulfilled.bind(visit, name + ' succeeded', cb, null),
            visit._onRejected.bind(visit, name + ' elasticsearch insert failed', cb));
  }
};

module.exports = visit;
