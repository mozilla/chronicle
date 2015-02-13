/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'backbone',
  'jquery',
  'views/base',
  'stache!templates/welcome',
  'lib/modal_manager',
  'config'
], function (_, Backbone, $, BaseView, WelcomeTemplate, modalManager, config) {
  'use strict';

  var WelcomeView = BaseView.extend({
    className: 'welcome',
    template: WelcomeTemplate,

    events: {
      'click button.install': 'install',
      'click button.continue': 'continue'
    },

    install: function (event) {
      event.preventDefault();

      $.Velocity.RunSequence([
        { e: this.$('#install-container'), p: 'transition.fadeOut' },
        { e: this.$('#continue-container'), p: 'transition.fadeIn' }
      ]);

      // Trigger add-on installation
      window.location = config.addon.firefox.url;
    },

    continue: function (event) {
      event.preventDefault();

      // Set the URL to the root but don't trigger since the view is already in place
      Backbone.history.navigate('/');

      modalManager.close({ effect: 'transition.fadeOut' });
    },

    getContext: function () {
      return {
        supportedBrowser: /firefox/i.test(window.navigator.userAgent)
      };
    }
  });

  return WelcomeView;
});
