/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('todo', {
    app: {
      files: {
        src: [
          'app/**/*.{js,css,scss,html}',
          '!app/bower_components/**'
        ]
      }
    },
    grunttasks: {
      files: {
        src: [
          'grunttasks/*.js',
          '!grunttasks/todo.js'
        ]
      }
    },
    server: {
      files: {
        src: [
          'server/**/*.js'
        ]
      }
    }
  });
};
