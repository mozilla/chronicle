/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

require.config({
  paths: {
    jquery: '../bower_components/jquery/dist/jquery',
    backbone: '../bower_components/backbone/backbone',
    underscore: '../bower_components/underscore/underscore',
    text: '../bower_components/requirejs-text/text',
    mustache: '../bower_components/mustache/mustache',
    stache: '../bower_components/requirejs-mustache/stache',
    moment: '../bower_components/moment/moment'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: [
        'underscore',
        'jquery'
      ],
      exports: 'Backbone'
    }
  }
});

function startApp() {
  require(['backbone', 'router'], function (Backbone) {
    Backbone.history.start();
  });
}

function startHome() {
  require(['views/home/home'], function (HomeView) {
    new HomeView({ el: 'html.home' });
  });
}

require([
  'jquery'
], function ($) {
  // Use the class on html to determine if we should boot home or app
  $('html').hasClass('app') ? startApp() : startHome();
});
