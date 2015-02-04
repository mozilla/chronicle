/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'jquery',
  'views/base',
  'stache!templates/visits/index',
  'collections/visits',
  'views/visits/item'
], function (_, $, BaseView, VisitsIndexTemplate, Visits, VisitsItemView) {
  'use strict';

  var VisitsIndexView = BaseView.extend({
    template: VisitsIndexTemplate,

    initialize: function () {
      this.collection = new Visits();

      this.lastVisitId = null;
      this.hasMoreVisits = true;
      this.loadingMoreVisits = false;
      this.count = 100;
      this.bottomBufferSize = 750;
      this.scrollDelay = 50;

      this.listenTo(this.collection, 'reset', this._renderVisits);

      this._fetch();
    },

    afterRender: function () {
      // check scroll position to see if we should load more visits
      // don't get crazy though. only check the scroll every this.scrollDelay ms
      $(window).on('scroll', _.throttle(this._checkScrollPosition.bind(this), this.scrollDelay));
    },

    beforeDestroy: function () {
      // stop checking scroll position
      $(window).off('scroll');
    },

    // this appends visit items rather than replacing them
    _renderVisits: function () {
      this.renderCollection(VisitsItemView, '.visits');
    },

    _fetch: function () {
      // let checkScrollPosition know that we're already loading more visits
      this.loadingMoreVisits = true;

      // prepare the data
      var data = {
        count: this.count
      };

      if (this.lastVisitId) {
        data.visitId = this.lastVisitId;
      }

      // fire off the xhr request
      var xhr = this.collection.fetch({ reset: true, data: data });

      // keep track of the state of things
      xhr.done(function (data) {
        this.loadingMoreVisits = false;

        // if the length is less than the count we know there aren't more results
        this.hasMoreVisits = this.collection.length === this.count;
        this.lastVisitId = this.collection.last().get('id');
      }.bind(this));
    },

    _checkScrollPosition: function () {
      if (!this.loadingMoreVisits && this.hasMoreVisits && this._getPixelsFromBottom() < this.bottomBufferSize) {
        this._fetch();
      }
    },

    _getPixelsFromBottom: function () {
      return $(document).height() - $('body').scrollTop() - $(window).height();
    },
  });

  return VisitsIndexView;
});
