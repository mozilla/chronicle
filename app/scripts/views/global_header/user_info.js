/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'jquery',
  'views/base',
  'stache!templates/global_header/user_info',
  'models/user'
], function ($, BaseView, UserInfoTemplate, User) {
  'use strict';

  var UserInfoView = BaseView.extend({
    template: UserInfoTemplate,
    events: {
      'click .trigger': '_toggleMenuState'
    },

    initialize: function () {
      this.model = new User();
      this.toggleSpeed = 200;

      this.listenTo(this.model, 'change', this.render);

      this.model.fetch();
    },

    _toggleMenuState: function (event) {
      var $target = $(event.currentTarget);

      if (!$target.hasClass('triggered')) {
        this._bindDismissMenu();
      } else {
        this._unbindDismissMenu();
      }

      this._toggleMenu();
    },

    _toggleMenu: function() {
      var $trigger = $('.trigger');
      var $menu = $('.menu');

      $trigger.stop().toggleClass('triggered');
      $menu.stop().fadeToggle(this.toggleSpeed);
    },

    _bindDismissMenu: function(event) {
      $('body').click(this._dismissMenu.bind(this));
    },

    _unbindDismissMenu: function() {
      $('body').off('click');
    },

    _dismissMenu: function(event) {
      var $target = $(event.target);

      if (!$target.is('.trigger, .trigger img, .menu') && !$target.closest('.menu').length) {
        this._toggleMenu();
        this._unbindDismissMenu();
      }
    }
    
  });

  return UserInfoView;
});
