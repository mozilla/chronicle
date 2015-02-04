/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'backbone',
  'views/base',
  'stache!templates/global_header/search_box'
], function (Backbone, BaseView, SearchBoxTemplate, router) {
  'use strict';

  var SearchBoxView = BaseView.extend({
    template: SearchBoxTemplate,

    events: {
      'submit form': 'search'
    },

    search: function (event) {
      event.preventDefault();

      var encodedQuery = window.encodeURIComponent(this.$('.query').val());

      Backbone.history.navigate('search/' + encodedQuery, { trigger: true });
    },

    afterRender: function () {
      this._setInputValue();
    },

    _setInputValue: function () {
      // Check the current URL fragment
      var fragmentMatch = Backbone.history.fragment.match(/search\/(.+)/);

      // Update the input box if we have a match
      if (fragmentMatch) {
        var query = window.decodeURIComponent(fragmentMatch[1]);

        this.$('.query').val(query);
      }
    }
  });

  return SearchBoxView;
});
