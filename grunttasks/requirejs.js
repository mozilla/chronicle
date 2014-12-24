/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('requirejs', {
    dist: {
      options: {
        almond: true,
        baseUrl: 'app/scripts',
        generateSourceMaps: true,
        mainConfigFile: 'app/scripts/main.js',
        name: 'main',
        optimize: 'uglify2',
        out: 'dist/scripts/compiled.js',
        preserveLicenseComments: false,
        removeCombined: true,
        replaceRequireScript: [{
          files: ['dist/index.html'],
          module: 'main',
          modulePath: '/assets/scripts/compiled'
        }],
        stubModules: ['text', 'stache'],
        useStrict: true
      }
    }
  });
};
