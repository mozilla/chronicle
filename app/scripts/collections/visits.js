/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'backbone',
  'models/visit'
], function (Backbone, Visit) {
  'use strict';

  var Visits = Backbone.Collection.extend({
    model: Visit,
    url: '/v1/visits'
  });

  return Visits;
});
