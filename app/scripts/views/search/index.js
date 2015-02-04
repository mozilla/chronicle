/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base',
  'stache!templates/search/index',
  'collections/search_results',
  'views/search/item'
], function (BaseView, SearchIndexTemplate, SearchResults, SearchItemView) {
  'use strict';

  var SearchIndexView = BaseView.extend({
    template: SearchIndexTemplate,

    initialize: function (query) {
      this.query = query;
      this.collection = new SearchResults();

      this.listenTo(this.collection, 'add destroy reset', this.render);

      // Fetch visits from the server
      this.collection.fetch({ reset: true, data: { q: this.query } });
    },

    getContext: function () {
      return {
        numberOfResults: this.collection.length,
        onlyOneResult: this.collection.length === 1
      };
    },

    afterRender: function () {
      this.renderCollection(SearchItemView, '.search-results');
    }
  });

  return SearchIndexView;
});
