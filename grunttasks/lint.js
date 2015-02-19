/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  var SUBTASKS = [
    'jshint',
    'jscs',
    'jsonlint',
    'copyright'
  ];

  grunt.registerTask('lint', SUBTASKS);
  grunt.registerTask('quicklint', SUBTASKS.map(function (task) {
    return 'newer:' + task;
  }));
};
