/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var crypto = require('crypto');
var Joi = require('joi');

var log = require('../logger')('server.routes.visits');
var visitsController = require('../controllers/visits');

var visitSchema = Joi.object().contains({
  url: Joi.string().required(),
  title: Joi.string().max(128).required(),
  visitedAt: Joi.date().iso().required(),
  // client can optionally provide uuid
  visitId: Joi.string().guid()
});

var visitsRoutes = [{
  method: 'GET',
  path: '/v1/visits',
  config: {
    handler: visitsController.get,
    auth: 'session',
    validate: {
      query: {
        count: Joi.number().integer().min(1).max(100).default(25),
        visitId: Joi.string().guid()
      }
    },
    description: 'Get <code>count</code> visits from the database, starting at <code>visitId</code>.',
    tags: ['visits']
  }
}, {
  method: 'POST',
  path: '/v1/visits',
  config: {
    handler: visitsController.post,
    auth: 'session',
    validate: {
      payload: Joi.required().includes(visitSchema)
    },
    tags: ['visits']
  }
}, {
  method: 'POST',
  path: '/v1/bulk_visits',
  config: {
    handler: visitsController.bulk,
    auth: 'session',
    validate: {
      payload: {
        priority: Joi.any().only('high', 'low', 'regular').default('regular'),
        visits: Joi.required().array().includes(visitSchema).min(1).max(50)
      }
    },
    tags: ['visits']
  }
}];

module.exports = visitsRoutes;
