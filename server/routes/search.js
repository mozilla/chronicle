/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Joi = require('joi');
var Boom = require('boom');

var searchController = require('../controllers/search');
var log = require('../logger')('server.routes.search');

var searchRoutes = [{
  method: 'GET',
  path: '/v1/search',
  config: {
    handler: searchController.get,
    auth: 'session',
    validate: {
      query: {
        q: Joi.string().required(),
        count: Joi.number().integer().min(1).max(100).default(25)
      }
    }
  }
}];

module.exports = searchRoutes;
