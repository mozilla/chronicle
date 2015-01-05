/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  var config = require('../server/config');

  var staticPath = config.get('server.staticPath');

  grunt.config('copy', {
    dist: {
      files: [
        {
          expand: true,
          dest: staticPath,
          cwd: 'app/',
          src: [
            'index.html'
          ]
        }
      ]
    }
  });
};
