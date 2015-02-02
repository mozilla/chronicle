/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'jquery',
  'config'
], function (_, $, config) {
  'use strict';

  var EMBEDLY_DISPLAY_ENDPOINT = '//i.embed.ly/1/display';

  // TODO: move this somewhere generic when it's needed in more than one place
  var IS_RETINA = window.devicePixelRatio >= 1.3;

  var imageProxy = {
    display: function (url) {
      return this._buildUrl('', { url: url });
    },

    crop: function (url, width, height) {
      return this._buildUrl('/crop', { url: url, width: width, height: height });
    },

    resize: function (url, width, height, grow) {
      return this._buildUrl('/resize', { url: url, width: width, height: height, grow: grow });
    },

    _buildUrl: function (action, options) {
      // add api key, retinify dimension options, and convert to query params
      var params = $.param(_.extend({ key: config.embedly.apiKey }, this._retinafyDimensions(options)));

      return EMBEDLY_DISPLAY_ENDPOINT + action + '?' + params;
    },

    // Increases the size of images to account for retina displays
    _retinafyDimensions: function (options) {
      if (IS_RETINA && options.width && options.height) {
        options.width = options.width * 2;
        options.height = options.height * 2;
      }

      return options;
    }
  };

  return imageProxy;
});
