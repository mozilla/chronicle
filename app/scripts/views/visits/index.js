/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'jquery',
  'moment',
  'views/base',
  'stache!templates/visits/index',
  'collections/visits',
  'views/visits/item',
  'views/visits/date_divider'
], function (_, $, moment, BaseView, VisitsIndexTemplate, Visits, VisitsItemView, VisitsDateDividerView) {
  'use strict';

  var VisitsIndexView = BaseView.extend({
    FETCH_RETRY_WAIT: 5000,

    template: VisitsIndexTemplate,

    initialize: function () {
      this.collection = new Visits();

      this.lastVisitId = null;
      this.hasMoreVisits = true;
      this.loadingMoreVisits = false;
      this.count = 50;
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
      var els = [];

      this.collection.each(function (visit) {
        var currentVisitDate = moment(visit.get('visitedAt')).startOf('day');

        if (!this.previousVisitDate || this.previousVisitDate.diff(currentVisitDate) !== 0) {
          els.push(this.trackSubview(new VisitsDateDividerView(currentVisitDate)).render().el);
        }

        els.push(this.trackSubview(new VisitsItemView({ model: visit })).render().el);

        this.previousVisitDate = currentVisitDate;
      }.bind(this));

      this.$('.visits').append(els);
    },

    _fetch: function () {
      // let checkScrollPosition know that we're already loading more visits
      this.loadingMoreVisits = true;

      var data = {
        count: this.count
      };

      if (this.lastVisitId) {
        data.visitId = this.lastVisitId;
      }

      // fire off the xhr request
      this.collection.fetch({ reset: true, data: data })
        .done(this._fetchDone.bind(this))
        .fail(this._fetchFailed.bind(this));
    },

    _fetchDone: function (data) {
      this.loadingMoreVisits = false;

      // if the length is less than the count we know there aren't more results
      this.hasMoreVisits = this.collection.length === this.count;
      this.lastVisitId = this.collection.last().get('id');
    },

    _fetchFailed: function (xhr) {
      // TODO: Do something interesting with 404s (no results)
    },

    _checkScrollPosition: function () {
      if (!this.loadingMoreVisits && this.hasMoreVisits && this._getPixelsFromBottom() < this.bottomBufferSize) {
        this._fetch();
      }
    },

    _getPixelsFromBottom: function () {
      return $(document).height() - $(document).scrollTop() - $(window).height();
    },
  });

  return VisitsIndexView;
});
