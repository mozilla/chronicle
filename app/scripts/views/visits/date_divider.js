/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'moment',
  'views/base',
  'stache!templates/visits/date_divider',
], function (_, moment, BaseView, VisitsDateDividerTemplate, UserPagePresenter) {
  'use strict';

  var VisitsDateDividerView = BaseView.extend({
    tagName: 'h3',
    className: 'visit-date-divider',
    template: VisitsDateDividerTemplate,

    initialize: function (date) {
      this.date = date;
    },

    getContext: function (date) {
      return {
        formattedDate: this._formatDate()
      };
    },

    _formatDate: function () {
      var formattedDate;

      var diff = this.date.diff(moment().startOf('day'), 'days');

      if (diff === 0) {
        formattedDate = 'Today';
      } else if (diff === -1) {
        formattedDate = 'Yesterday';
      } else {
        formattedDate = this.date.format('MMMM do');
      }

      return formattedDate;
    }
  });

  return VisitsDateDividerView;
});
