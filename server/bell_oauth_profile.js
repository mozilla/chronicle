/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('./logger')('server.bell.profile');
var user = require('./db/db').user;
var config = require('./config');

// this is the custom provider profile function used by Bell to allow us
// to convert oauth tokens into profile information.
// TODO `profileCb`, as defined by Bell, doesn't seem to take errors in the
// callback. So we will just throw errors from here :-\
function profile (credentials, params, get, profileCb) {
  log.verbose('obtained oauth tokens: ' + JSON.stringify(credentials));
  var headers = { headers: {'authorization': 'Bearer ' + params.access_token} };
  get(config.get('server.oauth.profileEndpoint'), headers, function(data) {
    // Bell returns the parsed data and handles errors internally
    log.verbose('exchanged tokens for profile data:' + JSON.stringify(data));
    // TODO use Joi to validate `data` before sending to DB
    user.get(data.uid, function (err, user) {
      if (err) {
        log.warn('user.get failed: ' + err);
        throw err;
      }
      if (user) {
        log.verbose('user exists! updating oauth token and setting session cookie...');
        user.update(data.uid, data.email, params.access_token, function(err) {
          if (err) {
            log.warn('user.update failed: ' + err);
            throw err;
          }
          // finally, set the cookie and redirect.
          log.verbose('logged in existing user ' + data.email);
          credentials.profile = {fxaId: data.uid};
          return profileCb(credentials);
        });
      } else {
        log.verbose('new user! creating record and setting session cookie...');
        user.create(data.uid, data.email, params.access_token, function(err) {
          if (err) {
            log.warn('user.create failed: ' + err);
            throw err;
          }
          log.verbose('created new user ' + data.email);
          credentials.profile = {fxaId: data.uid, isNewUser: true};
          return profileCb(credentials);
        });
      }
    });
  });
}
module.exports = profile;
