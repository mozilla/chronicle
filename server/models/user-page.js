/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// we need a user-pages abstraction so that async scraper jobs
// can separately handle creating the visit and creating the
// user page. someday this might also be used by the client-facing API layer.

var uuid = require('uuid');

var postgres = require('../db/postgres');
var elasticsearch = require('../db/elasticsearch');
var log = require('../logger')('server.models.user-page');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var userPage = {
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    return callback(null, results);
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  update: function(userId, url, urlHash, title, data, cb) {
    // fetch the page id, lazily creating it if it doesn't exist,
    // then update the page with the huge blob of embedly data
    //
    // TODO if we don't fire a callback on creation, we should return a promise _or_
    // fire 'userPage::updated' or 'userPage::updateError' events
    var name = 'models.user-page.update';
    _verbose(name + ' called', userId, url);
    var noCamel = true; // do not camelize the results
    var currentTime = new Date().toJSON();
    var lazyCreateParams = [uuid.v4(), userId, url, urlHash, title, currentTime];
    var lazyCreateUserPageQuery = 'WITH new_page AS (  ' +
      '  INSERT INTO user_pages (id, user_id, url, raw_url, url_hash, title, created_at, updated_at) ' +
      '  SELECT $1, $2, $3, $3, $4, $5, $6, $6 ' +
      '  WHERE NOT EXISTS (SELECT id FROM user_pages WHERE user_id = $2 AND url_hash = $4) ' +
      '  RETURNING id ' +
      ') SELECT id FROM new_page ' +
      'UNION SELECT id FROM user_pages WHERE user_id = $2 AND url_hash = $4';
    var addExtractedDataQuery = 'UPDATE user_pages ' +
    'SET (extracted_data, updated_at) = ($1, $2) ' +
    'WHERE user_id = $3 and id = $4 ' +
    'RETURNING *';
    var addDataParams = [data, currentTime, userId];
    _verbose('about to issue lazy user page creation query');
    var userPageId;
    postgres.query(lazyCreateUserPageQuery, lazyCreateParams)
      .then(function(result) {
        // we just got the page_id; push it onto the end of the params array
        _verbose('the lazy create result is ' + JSON.stringify(result));
        _verbose('the userPageId is ' + result.id);
        userPageId = result.id;
        addDataParams.push(result.id);
        return postgres.query(addExtractedDataQuery, addDataParams, noCamel);
      })
      .then(function(completeResult) {
        // make the ES record mirror the PG record, for simplicity's sake
        var esQuery = {
          index: 'chronicle',
          type: 'user_pages',
          id: userPageId,
          body: completeResult
        };
        _verbose('the elasticsearch query is ' + JSON.stringify(esQuery));
        return elasticsearch.query('index', esQuery);
      })
      .done(userPage._onFulfilled.bind(userPage, name + ' succeeded', cb),
            userPage._onRejected.bind(userPage, name + ' failed', cb));

  },
  get: function(userId, userPageId, cb) {
    var name = 'models.user-page.get';
    _verbose(name + ' called', userId, userPageId);
    postgres.query('SELECT * FROM user_pages WHERE user_id = $1 and id = $2', [userId, userPageId])
      .done(userPage._onFulfilled.bind(userPage, name + ' succeeded', cb),
            userPage._onRejected.bind(userPage, name + ' failed', cb));
  },
  // XXX this means "does it exist and has it been scraped yet", not "does it exist".
  // but an 'exists' function might be nice eventually
  hasMetadata: function(userId, urlHash, cb) {
    var name = 'models.user-page.hasMetadata';
    _verbose(name + ' called', userId, urlHash);
    var query = 'SELECT exists(SELECT 1 FROM user_pages WHERE ' +
                'user_id = $1 AND url_hash = $2 AND extracted_data IS NOT NULL)';
    postgres.query(query, [userId, urlHash])
      .done(function(result) {
        userPage._onFulfilled(name + ' succeeded', cb, result.exists);
      },
      userPage._onRejected.bind(userPage, name + ' failed', cb));
  }
};
module.exports = userPage;
