/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');
var uuid = require('uuid');

var config = require('../config');
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
  // TODO add user_pages data when getting a visit
  get: function(fxaId, visitId, cb) {
    var name = 'models.visit.get';
    _verbose(name + ' called', fxaId, visitId);
    var query = 'SELECT * FROM visits, user_pages ' +
                'WHERE visits.id = $1 AND visits.fxa_id = $2 ' +
                'AND visits.user_page_id = user_pages.id'; // implicit INNER JOIN
    // if exists (SELECT fxa_id FROM user WHERE fxa_id = $1) then
    var params = [visitId, fxaId];
    postgres.query(query, params)
      .done(visit._onFulfilled.bind(visit, name + ' succeeded', cb),
            visit._onRejected.bind(visit, name + ' failed', cb));
  },

  create: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    var name = 'models.visit.create';
    _verbose(name + ' called', fxaId, visitId, visitedAt, url, title);
    // create the user_page if it doesn't exist, and return the user_page id
    // whether or not you just created it
    var lazyCreateUserPageQuery =
      'WITH new_page AS (  ' +
      '  INSERT INTO user_pages (id, fxa_id, url, raw_url, url_hash, title) ' +
      '  SELECT $1, $2, $3, $3, $4, $5 ' +
      '  WHERE NOT EXISTS (SELECT id FROM user_pages WHERE fxa_id = $2, url_hash = $4) ' +
      '  RETURNING id ' +
      ') SELECT id FROM new_page ' +
      'UNION SELECT id FROM user_pages WHERE url_hash = $4';
    var lazyCreateParams = [uuid.v4(), fxaId, url, urlHash, title, visitId, visitedAt];
    var createVisitQuery = 'INSERT INTO visits ' +
      '(id, fxa_id, user_page_id, raw_url, url, url_hash, title, visited_at) ' +
      'VALUES ($1, $2, $3, $4, $4, $5, $6, $7)';
    var userPageId;

    // NEXT TODO AFTER LUNCH: fixup the es query. include userPageId.
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
    postgres.query(lazyCreateUserPageQuery, lazyCreateParams)
      .fail(visit._onRejected.bind(visit, name + ' failed', cb))
      .then(function(results) {
        // TODO will userPageId be correct? find out :-P
        userPageId = results && results.id;
        var visitParams = [visitId, fxaId, userPageId, url, url, urlHash, title, visitedAt];
        // return the new query's promise to avoid nesting promise chains
        return postgres.query(createVisitQuery, visitParams);
      })
      .fail(visit._onRejected.bind(visit, name + ' postgres insert failed', cb))
      .then(elasticsearch.query('create', esQuery))
      .done(visit._onFulfilled.bind(visit, name + ' succeeded', cb, null),
            visit._onRejected.bind(visit, name + ' elasticsearch insert failed', cb));
  },
  // TODO use this to asynchronously fill in user_pages data
  update: function(fxaId, visitId, params, cb) {
  }
};

module.exports = visit;
