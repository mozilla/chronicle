/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var routes = [];

// Require each of the file in the current directory (except index.js).
fs.readdirSync(__dirname).forEach(function(file) {
  if (file === 'index.js') { return; }
  routes = routes.concat(require('./' + file));
});
module.exports = routes;
