/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('./logger')('server.bell.profile');
var user = require('./models/user');
var config = require('./config');
var queue = require('./work-queue/queue');
var allowedUsers = config.get('alpha_allowedUsers');

// this is the custom provider profile function used by Bell to allow us
// to convert oauth tokens into profile information.
// TODO `profileCb`, as defined by Bell, doesn't seem to take errors in the
// callback. So we will just throw errors from here :-\
function profile (credentials, params, get, profileCb) {
  log.verbose('obtained oauth tokens: ' + JSON.stringify(credentials));
  var headers = { headers: {'authorization': 'Bearer ' + params.access_token} };
  get(config.get('server_oauth_profileEndpoint'), headers, function(data) {
    // Bell returns the parsed data and handles errors internally
    log.verbose('exchanged tokens for profile data:' + JSON.stringify(data));

    // XXX temporary while we're in alpha: only allow whitelisted users, but let
    // the controller handle the error; Bell seems to lock us into 500ing.
    if (allowedUsers.indexOf(data.email) === -1) {
      log.warn('Non-whitelisted user attempted to log in: ' + data.email);
      credentials.profile = {email: data.email, userId: null, isAllowed: false};
      return profileCb(credentials);
    }

    // TODO use Joi to validate `data` before sending to DB
    user.get(data.uid, function (err, result) {
      if (err) {
        log.warn('user.get failed: ' + err);
        throw err;
      }
      if (result) {
        log.verbose('user exists! updating oauth token and setting session cookie...');
        user.update(data.uid, data.email, params.access_token, function(err) {
          if (err) {
            log.warn('user.update failed: ' + err);
            throw err;
          }
          // finally, set the cookie and redirect.
          log.verbose('logged in existing user ' + data.email);
          credentials.profile = {userId: data.uid, isAllowed: true};
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
          credentials.profile = {userId: data.uid, isNewUser: true, isAllowed: true};
          // sticking with the default priority for now
          queue.sendWelcomeEmail({
            priority: 'low',
            data: {email: data.email}
          });
          return profileCb(credentials);
        });
      }
    });
  });
}
module.exports = profile;
