/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base',
  'stache!templates/global_header/global_header',
  'views/global_header/user_info',
  'views/global_header/search_box'
], function (BaseView, GlobalHeaderTemplate, UserInfoView, SearchBoxView) {
  'use strict';

  var GlobalHeaderView = BaseView.extend({
    template: GlobalHeaderTemplate,

    initialize: function () {
      this.userInfoView = new UserInfoView();
      this.searchBoxView = new SearchBoxView();
    },

    afterRender: function () {
      this.assign(this.userInfoView, '#user-info');
      this.assign(this.searchBoxView, '#search-box');
    }
  });

  return GlobalHeaderView;
});
