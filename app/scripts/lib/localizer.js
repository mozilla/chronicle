/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'jquery'
], function (_, $) {
  'use strict';

  /**
  * Singleton object that fetches localizations from the server and localizes English strings.
  *
  * @class Localizer
  *
  * @constructor
  */
  var Localizer = {
    dictionary: {},

    /**
    * Fetches the localized strings from the server and saves them for later.
    *
    * @return {jqXHR} jqXHR jQuery XHR object representing the request
    */
    // TODO: Enable server side localization (issue #28).
    fetch: function () {
      var xhr = $.ajax('/1/l10n/client.json');

      var self = this;

      xhr.fail(function () {
        // Reset the dictionary on failure
        self.dictionary = {};
      });

      xhr.done(function (data) {
        self.dictionary = data;
      });

      return xhr;
    },

    /**
    * Localizes the English input string. Returns the input string if nothing is found.
    *
    * @return {String} localized string
    */
    localize: function (input) {
      var output = this.dictionary[input];

      // null or empty string returns input
      return output && output.trim().length ? output : input;
    }
  };

  return Localizer;
});
