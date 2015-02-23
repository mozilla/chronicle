/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// We really should have one visit datatype returned by the API
// It's a temporary weirdness that this is formatted differently

var config = require('../config');
var utils = require('../utils');
var url2png = require('url2png')(config.get('url2png_apiKey'), config.get('url2png_secretKey'));

var legacyTransform = function(item) {
  if (!item._source.extracted_data) { return item; }
  item._source.extractedFaviconUrl = item._source.extracted_data.favicon_url;
  if (item._source.extracted_data.images && item._source.extracted_data.images.length) {
    item._source.extractedImageUrl = item._source.extracted_data.images[0].url;
    item._source.extractedImageEntropy = item._source.extracted_data.images[0].entropy;
    item._source.extractedImageWidth = item._source.extracted_data.images[0].width;
    item._source.extractedImageHeight = item._source.extracted_data.images[0].height;
  }
  item._source.extractedTitle = item._source.extracted_data.title;
  item._source.extractedDescription = item._source.extracted_data.description;
  return item;
};

var addScreenshot = function(item) {
  item._source.screenshot_url = url2png.buildURL(item._source.url, {viewport: '1024x683', thumbnail_max_width: 540});
  return item;
};

var searchView = {
  render: function(results) {
    var items = results.results.hits;
    var out = [];
    if (!items.length) { items = [items]; }
    items.forEach(function(item) {
      // same basic deal as the visit view, but just different enough to be annoying >:-|
      out.push(utils.camelize(addScreenshot(legacyTransform(item))));
    });
    results.results.hits = out;
  }
};

module.exports = searchView;
