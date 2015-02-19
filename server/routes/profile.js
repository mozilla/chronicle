/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Joi = require('joi');

var log = require('../logger')('server.routes.profile');
var profileController = require('../controllers/profile');

var profileRoutes = [{
  method: 'GET',
  path: '/v1/profile',
  config: {
    handler: profileController.get,
    auth: 'session',
    tags: ['profile']
  }
}];

module.exports = profileRoutes;
