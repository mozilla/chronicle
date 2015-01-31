/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('useminPrepare', {
    app: {
      src: [
        '<%= staticPath %>/*.html'
      ],
      dest: '<%= staticPath %>',
      type: 'html'
    }
  });

  grunt.config('usemin', {
    options: {
      assetsDirs: [
        '<%= staticPath %>'
      ],
      patterns: {
        js: [
          [/(\/images\/.*?\.png)/gm, 'Update the JS to reference revved images']
        ]
      }
    },
    css: ['<%= staticPath %>/styles/*.css'],
    html: ['<%= staticPath %>/*.html'],
    js: ['<%= staticPath %>/scripts/*.js']
  });
};
