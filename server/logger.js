/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var mozlog = require('mozlog');
var config = require('./config');

// TODO we shouldn't need copypasta when we are composing 2 log libraries already :-\
mozlog.config({
  app: config.get('server_log_app'),
  level: config.get('server_log_level'),
  fmt: config.get('server_log_fmt'),
  debug: config.get('server_log_debug')
});
var root = mozlog(config.get('server_log_app'));
if (root.isEnabledFor('debug')) {
  root.warn('\t*** CAREFUL! Louder logs (less than INFO)' +
  ' may include SECRETS! ***');
}
module.exports = mozlog;
