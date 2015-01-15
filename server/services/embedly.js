/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// example extract API request:
// https://api.embed.ly/1/extract?key=:key&url=:url&maxwidth=:maxwidth&maxheight=:maxheight&format=:format&callback=:callback

var config = require('../config');
var endpoint = config.get('scraper.endpoint');
var apiKey = config.get('scraper.apiKey');

module.exports = function scrape(url) {
  var scraperUrl = endpoint + '?key=' + apiKey + '&url=' + url;
  // make the request
  // handle the response
  // throw the response in elasticsearch
  // create the pages table
  // add something to the pages table
  // decide whether to add that metadata to the visits table also (if yes, include visit id)
  // probably also need user id
};
