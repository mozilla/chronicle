/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  var config = require('../server/config');

  // Add custom delimiters since our javascript has both mustache and underscore delimiters embedded
  grunt.template.addDelimiters('js-config-delimiters', '{%', '%}');

  grunt.config('template', {
    scripts: {
      options: {
        data: {
          config: config
        },
        delimiters: 'js-config-delimiters'
      },
      files: {
        '<%= staticPath %>/scripts/compiled.js': ['<%= staticPath %>/scripts/compiled.js']
      }
    },
    database: {
      options: {
        data: {
          PGDATABASE: config.get('db.postgres.database'),
          PGPASSWORD: config.get('db.postgres.password'),
          PGPORT: config.get('db.postgres.port'),
          PGUSER: config.get('db.postgres.user'),
          USER: process.env.USER
        },
        delimiters: 'js-config-delimiters'
      },
      files: {
        'server/db/create_db.sh': ['server/db/create_db.sht']
      }
    }
  });
};
