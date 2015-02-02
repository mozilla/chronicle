/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt, { pattern: ['grunt-*', 'intern'] });

  var config = require('./server/config');

  grunt.initConfig({
    staticPath: config.get('server_staticPath')
  });

  grunt.loadTasks('grunttasks/');
};
