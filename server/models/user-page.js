/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// we need a user-pages abstraction so that async scraper jobs
// can separately handle creating the visit and creating the
// user page. someday this might also be used by the client-facing API layer.

var underscored = require('underscore.string').underscored;
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
    callback(null, results);
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
    var lazyCreateParams = [uuid.v4(), userId, url, urlHash, title];
    var lazyCreateUserPageQuery = 'WITH new_page AS (  ' +
      '  INSERT INTO user_pages (id, user_id, url, raw_url, url_hash, title) ' +
      '  SELECT $1, $2, $3, $3, $4, $5 ' +
      '  WHERE NOT EXISTS (SELECT id FROM user_pages WHERE user_id = $2 AND url_hash = $4) ' +
      '  RETURNING id ' +
      ') SELECT id FROM new_page ' +
      'UNION SELECT id FROM user_pages WHERE user_id = $2 AND url_hash = $4';
    var addExtractedDataQuery = 'UPDATE user_pages SET ( ' +
    'extracted_at, extracted_author_name, extracted_author_url, extracted_cache_age, ' +
    'extracted_content, extracted_description, extracted_favicon_color, extracted_favicon_url, ' +
    'extracted_image_caption, extracted_image_color, extracted_image_entropy, ' +
    'extracted_image_height, extracted_image_url, extracted_image_width, extracted_language, ' +
    'extracted_lead, extracted_media_duration, extracted_media_height, extracted_media_html, ' +
    'extracted_media_type, extracted_media_width, extracted_provider_display, ' +
    'extracted_provider_name, extracted_provider_url, extracted_published, extracted_safe, ' +
    'extracted_title, extracted_type, extracted_url, updated_at) ' +
    ' = ' +
    '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, ' +
    '$19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) ' +
    'WHERE user_id = $31 AND id = $32 ' +
    'RETURNING *';
    var addDataParams = [data.extractedAt, data.extractedAuthorName, data.extractedAuthorUrl, 
      data.extractedCacheAge, data.extractedContent, data.extractedDescription,
      data.extractedFaviconColor, data.extractedFaviconUrl, data.extractedImageCaption, 
      data.extractedImageColor, data.extractedImageEntropy, data.extractedImageHeight, 
      data.extractedImageUrl, data.extractedImageWidth, data.extractedLanguage, data.extractedLead,
      data.extractedMediaDuration, data.extractedMediaHeight, data.extractedMediaHtml,
      data.extractedMediaType, data.extractedMediaWidth,
      data.extractedProviderDisplay, data.extractedProviderName, data.extractedProviderUrl,
      data.extractedPublished, data.extractedSafe, data.extractedTitle, data.extractedType,
      data.extractedUrl, new Date().toJSON(), userId];

    _verbose('about to issue lazy user page creation query');
    var userPageId;
    postgres.query(lazyCreateUserPageQuery, lazyCreateParams)
      .fail(userPage._onRejected.bind(userPage, name + ' failed early', cb))
      .then(function(result) {
        // we just got the page_id; push it onto the end of the params array
        _verbose('the lazy create result is ' + JSON.stringify(result));
        _verbose('the userPageId is ' + result.id);
        userPageId = result.id;
        addDataParams.push(result.id);
        return postgres.query(addExtractedDataQuery, addDataParams);
      })
      .fail(userPage._onRejected.bind(userPage, name + ' failed postgres insert', cb))
      .then(function() {
        // update ES with _everything_ for now
        data.userId = userId;
        data.url = url;
        data.title = title;
        data.urlHash = urlHash;
        var esQuery = {
          index: 'chronicle',
          type: 'userPages',
          id: userPageId,
          body: data
        };

        _verbose('the elasticsearch query is ' + JSON.stringify(esQuery));
        // if the page doesn't exist yet, this task creates it. visit.create gives up if
        // the page exists, preventing the scraper fields from being deleted.
        return elasticsearch.query('index', esQuery);
      })
      .done(userPage._onFulfilled.bind(userPage, name + ' succeeded', cb),
            userPage._onRejected.bind(userPage, name + ' failed late', cb));

  },
  get: function(userId, userPageId, cb) {
    var name = 'models.user-page.get';
    _verbose(name + ' called', userId, userPageId);
    postgres.query('SELECT * FROM user_pages WHERE user_id = $1 and id = $2', [userId, userPageId])
      .done(userPage._onFulfilled.bind(userPage, name + ' succeeded', cb),
            userPage._onRejected.bind(userPage, name + ' failed', cb));
  }
};
module.exports = userPage;
