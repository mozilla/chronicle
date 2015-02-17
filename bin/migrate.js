#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// use this script to call our pg-patcher wrapper via the command line.
// TODO add 'next' and 'prev' convenience methods?
// TODO bring back commander, I guess

'use strict';

var fs = require('fs');
var path = require('path');
var log = require('../server/logger')('bin.migrate');
var migrator = require('../server/db/migrator');
var targetLevel = parseInt(process.argv[2], 10);
var files;

// if no args were passed, or if the arg wasn't an integer,
// then, by default, use the highest defined patch level
if (isNaN(targetLevel)) {
  files = fs.readdirSync(path.join(__dirname , '..', 'server', 'db', 'migrations'));
  var max = 0;
  files.forEach(function(file) {
    // assume files are of the conventional form 'patch-n-m.sql'
    // we want the largest m in the dir
    // the regex splits the filename into ['patch', 'n', 'm', 'sql']
    var curr = file.split(/[-\.]/)[2];
    if (curr > max) { max = curr; }
  });
  targetLevel = max;
}

migrator(targetLevel)
  .done(function onSuccess(resp) {
    log.info('migration succeeded');
  }, function onFailure(err) {
    log.error('migration failed: ' + err);
  });
