/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'backbone',
  'models/user_page'
], function (_, Backbone, UserPage) {
  'use strict';

  var SearchResults = Backbone.Collection.extend({
    model: UserPage,
    url: '/v1/search',

    parse: function (response, xhr) {
      if (response && response.results && response.results.hits) {
        return _.collect(response.results.hits, function (hit) {
          return hit._source;
        });
      }
    }
  });

  return SearchResults;
});
