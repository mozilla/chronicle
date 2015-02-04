/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'jquery',
  'backbone',
  'views/global_header/global_header',
  'views/visits/index',
  'views/search/index'
], function ($, Backbone, GlobalHeaderView, VisitsIndexView, SearchIndexView) {
  'use strict';

  var Router = Backbone.Router.extend({
    routes: {
      '': 'showIndex',
      'search/(:query)': 'showSearchIndex'
    },

    initialize: function () {
      this.initializeGlobalHeader();
      this.watchAnchors();
    },

    initializeGlobalHeader: function () {
      this.globalHeaderView = new GlobalHeaderView();

      // This renders the first time the stage is set
      $('#global-header').html(this.globalHeaderView.el);
    },

    showIndex: function () {
      this.setStage(new VisitsIndexView());
    },

    showSearchIndex: function (query) {
      this.setStage(new SearchIndexView(query));
    },

    setStage: function (view) {
      // Destroy the current view before replacing it
      if (this.currentView) {
        this.currentView.destroy();
      }

      this.currentView = view;

      // Render and insert view into the stage
      $('#stage').html(this.currentView.render().el);

      // Render the header again to give it a chance to update based on the current state
      // This could be an annoyance at some point but it's reliable for now
      this.globalHeaderView.render();
    },

    // watches for clicks that should be handled by backbone and calls navigate internally
    watchAnchors: function () {
      $(window.document).on('click', 'a[href^="/"]', function (event) {
        // someone killed this event, ignore it.
        if (event.isDefaultPrevented()) {
          return;
        }

        if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
          event.preventDefault();

          // Remove leading slashes
          var url = $(event.target).attr('href').replace(/^\//, '');

          // Instruct Backbone to trigger routing events
          this.navigate(url, { trigger: true });
        }
      }.bind(this));
    }
  });

  // return singleton
  return new Router();
});
