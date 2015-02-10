/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base'
], function (BaseView) {
  'use strict';

  var HomeView = BaseView.extend({
    initialize: function () {
      this.$('h2').html('home sweet home');
    },

    // the html is delivered in the page by the server. nothing to render.
    render: function () {
      return this;
    }
  });

  return HomeView;
});
