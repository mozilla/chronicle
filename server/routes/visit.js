/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Joi = require('joi');

var log = require('../logger')('server.routes.visit');
var visitController = require('../controllers/visit');

var visitRoutes = [{
  method: 'GET',
  path: '/v1/visits/{visitId}',
  config: {
    handler: visitController.get,
    auth: 'session',
    validate: {
      params: {
        visitId: Joi.string().guid().required()
      }
    }
  }
}, {
  method: 'PUT',
  path: '/v1/visits/{visitId}',
  config: {
    handler: visitController.put,
    auth: 'session',
    validate: {
      // all fields are required, keep life simple for the DB
      payload: {
        url: Joi.string().required(),
        title: Joi.string().max(128).required(),
        visitedAt: Joi.date().iso().required()
      },
      params: {
        visitId: Joi.string().guid().required()
      }
    }
  }
}, {
  method: 'DELETE',
  path: '/v1/visits/{visitId}',
  config: {
    handler: visitController.delete,
    auth: 'session',
    validate: {
      params: {
        visitId: Joi.string().guid().required()
      }
    }
  }
}];

module.exports = visitRoutes;
