/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('copy', {
    dist: {
      files: [
        {
          expand: true,
          dest: 'dist/',
          cwd: 'app/',
          src: [
            'bower_components/**',
            'styles/*.css',
            'index.html'
          ]
        }
      ]
    },
    css: {
      files: [
        {
          expand: true,
          dest: 'dist/',
          cwd: 'app/',
          src: ['styles/*.css']
        }
      ]
    }
  });
};
