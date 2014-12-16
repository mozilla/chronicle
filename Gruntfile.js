/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    contributors: {
      app: {
        path: '/AUTHORS',
        branch: 'master'
      }
    },
    changelog: {
      dest: 'CHANGELOG.md'
    }
  });
};
