/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  var config = require('../server/config');

  grunt.config('sass', {
    options: {
      imagePath: '/images',
      outputStyle: config.get('sass_outputStyle'),
      precision: 3,
      sourceMap: true
    },
    styles: {
      files: [{
        src: ['app/styles/main.scss'],
        dest: '<%= staticPath %>/styles/compiled.css'
      }]
    }
  });
};
