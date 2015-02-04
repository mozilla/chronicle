/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'views/base',
  'stache!templates/user_pages/item',
  'models/user_page',
  'presenters/user_page_presenter'
], function (_, BaseView, UserPagesItemView, UserPage, UserPagePresenter) {
  'use strict';

  var VisitsItemView = BaseView.extend({
    className: 'visit user-page',
    template: UserPagesItemView,

    events: {
      'click .destroy': 'destroyModel'
    },

    initialize: function () {
      this.userPage = new UserPage(this.model.get('userPage'));
      this.presenter = new UserPagePresenter(this.userPage, { relatedVisit: this.model });
    },

    getContext: function () {
      return this.presenter;
    },

    afterRender: function () {
      // add size class
      this.$el.addClass(this.presenter.getSizeClassName());
    },

    destroyModel: function (event) {
      event.preventDefault();

      if (window.confirm('Destroy this visit?')) {
        this.model.destroy();

        this.$el.fadeOut(function () {
          this.remove();
        }.bind(this));
      }
    }
  });

  return VisitsItemView;
});
