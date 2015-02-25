/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var camelizeLib = require('underscore.string').camelize;

var utils = {
  camelize: function(item) {
    // Object.keys throws if not passed an array or object
    // typeof item == 'object' for array, object, null.
    // check truthiness to exclude null. TODO use Joi instead, way too clever
    if (!item || typeof item !== 'object') { return item; }
    var output = {};
    Object.keys(item).forEach(function(k) {
      // special case: don't modify elasticsearch keys like _id, _type, _source
      if (k.indexOf('_') === 0) {
        output[k] = item[k];
      } else {
        output[camelizeLib(k)] = item[k];
      }
    });
    // special case: json extracted_data blob, seen in postgres
    if (item.extracted_data) {
      output.extractedData = utils.camelize(item.extracted_data);
    }
    // special case: elasticsearch _source field
    // TODO: maybe just recurse instead of this terrible hackiness
    if (item._source) {
      output._source = utils.camelize(item._source);
    }
    return output;    
  }
};

module.exports = utils;
