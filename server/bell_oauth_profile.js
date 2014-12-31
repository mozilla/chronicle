/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('./logger')('server.bell.profile');
var db = require('./db/db');
var config = require('./config');

// this is the custom provider profile function used by Bell to allow us
// to convert oauth tokens into profile information.
function profile (credentials, params, get, profileCb) {
  log.verbose('obtained oauth tokens: ' + JSON.stringify(credentials));
  var headers = { headers: {'authorization': 'Bearer ' + params.access_token} };
  get(config.get('server.oauth.profileEndpoint'), headers, function(data) {
    // Bell returns the parsed data and handles errors internally
    log.verbose('exchanged tokens for profile data:' + JSON.stringify(data));
    // TODO use Joi to validate `data` before sending to DB
    db.getUserById(data.uid, function (err, user) {
      if (err) {
        log.warn('getUserById failed: ' + err);
        return profileCb('getUserById failed: ' + err);
      }
      if (user) {
        log.verbose('user exists! updating oauth token and setting session cookie...');
        db.updateUser(data.uid, data.email, params.access_token, function(err) {
          if (err) {
            log.warn('updateUser failed: ' + err);
            return profileCb('logging in user failed: ' + err);
          }
          // finally, set the cookie and redirect.
          log.verbose('logged in existing user ' + data.email);
          credentials.profile = {fxaId: data.uid};
          return profileCb(null, credentials);
        });
      } else {
        log.verbose('new user! creating record and setting session cookie...');
        db.createUser(data.uid, data.email, params.access_token, function(err) {
          if (err) {
            log.warn('user creation failed: ' + err);
            return profileCb('creating new user failed: ' + err);
          }
          log.verbose('created new user ' + data.email);
          credentials.profile = {fxaId: data.uid, isNewUser: true};
          return profileCb(null, credentials);
        });
      }
    });
  });
}
module.exports = profile;
