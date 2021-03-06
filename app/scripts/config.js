/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
], function () {
  'use strict';

  var config = {
    embedly: {
      apiKey: '{%= config.get("embedly_apiKey") %}'
    },
    addon: {
      firefox: {
        url: '{%= config.get("addon_firefox_url") %}'
      }
    }
  };

  return config;
});
