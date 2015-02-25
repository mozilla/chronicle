/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var config = require('../config');
var url2png = require('url2png')(config.get('url2png_apiKey'), config.get('url2png_secretKey'));

var transform = function(results) {
  // keep visit properties top level, move all other page properties under a userPage key
  var newResult = {};
  ['id', 'url', 'title', 'visited_at'].forEach(function(item) {
    newResult[item] = results[item];
    delete results[item];
  });

  // remove the userId from the visit, if present
  delete results.userId;

  newResult.userPage = results;
  return newResult;
};

var legacyTransform = function(item) {
  if (!item.userPage.extractedData) { return item; }
  // send down the old keys that were getting used
  item.userPage.extractedFaviconUrl = item.userPage.extractedData.faviconUrl;
  if (item.userPage.extractedData.images && item.userPage.extractedData.images.length) {
    item.userPage.extractedImageUrl = item.userPage.extractedData.images[0].url;
    item.userPage.extractedImageEntropy = item.userPage.extractedData.images[0].entropy;
    item.userPage.extractedImageWidth = item.userPage.extractedData.images[0].width;
    item.userPage.extractedImageHeight = item.userPage.extractedData.images[0].height;
  }
  item.userPage.extractedTitle = item.userPage.extractedData.title;
  item.userPage.extractedDescription = item.userPage.extractedData.description;
  return item;
};

var addScreenshot = function(item) {
  item.screenshot_url = url2png.buildURL(item.url, {viewport: '1024x683', thumbnail_max_width: 540});
  return item;
};

var visitView = {
  // TODO listen for changes on a model instead, get fancy ^_^
  render: function(data) {
    return addScreenshot(legacyTransform(transform(data)));
  },
};

module.exports = visitView;
