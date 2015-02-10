/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore');

module.exports = function (grunt) {
  'use strict';

  var DEFAULT_OPTIONS = {
    almond: true,
    baseUrl: 'app/scripts',
    generateSourceMaps: true,
    mainConfigFile: 'app/scripts/main.js',
    name: 'main',
    optimize: 'none',
    out: '<%= staticPath %>/scripts/compiled.js',
    preserveLicenseComments: false,
    removeCombined: true,
    replaceRequireScript: [{
      files: ['<%= staticPath %>/*.html'],
      module: 'main',
      modulePath: 'scripts/compiled'
    }],
    stubModules: ['text', 'stache'],
    useStrict: true
  };

  grunt.config('requirejs', {
    development: {
      options: DEFAULT_OPTIONS
    },
    production: {
      options: _.extend({}, DEFAULT_OPTIONS, { optimize: 'uglify2' })
    }
  });
};
