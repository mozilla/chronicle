/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'views/base',
  'stache!templates/user_pages/item',
  'presenters/user_page_presenter'
], function (_, BaseView, UserPagesItemTemplate, UserPagePresenter) {
  'use strict';

  var SearchItemView = BaseView.extend({
    className: 'search-result user-page medium',
    template: UserPagesItemTemplate,

    initialize: function () {
      this.presenter = new UserPagePresenter(this.model, { alternateImages: false });
    },

    getContext: function () {
      return this.presenter;
    }
  });

  return SearchItemView;
});
