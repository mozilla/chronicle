/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base',
  'stache!templates/global_header/user_info',
  'models/user'
], function (BaseView, UserInfoTemplate, User) {
  'use strict';

  var UserInfoView = BaseView.extend({
    template: UserInfoTemplate,

    initialize: function () {
      this.model = new User();

      this.listenTo(this.model, 'change', this.render);

      this.model.fetch();
    }
  });

  return UserInfoView;
});
