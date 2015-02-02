/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var es = require('elasticsearch');
var Q = require('q');

var config = require('../config');
var log = require('../logger')('server.db.elasticsearch');

// >:-(
// https://github.com/elasticsearch/elasticsearch-js/issues/33
var esParamsFactory = function() {
  return {
    host: {
      host: config.get('db_elasticsearch_host'),
      post: config.get('db_elasticsearch_port'),
      log: 'verbose'
    }
  };
};

// TODO figure out connection pooling and do it in here ^_^
var elasticsearch = {
  timeout: config.get('db_elasticsearch_queryTimeout'),
  // query elasticsearch; returns a promise
  //
  // queryType := es client API method, for example, 'create'
  // params := es query DSL object
  query: function query(queryType, params) {
    var esClient = new es.Client(esParamsFactory());
    // force promises to eventually resolve
    // NOTE: I checked, elasticsearch uses bluebird, which supports Promise.timeout ^_^
    return esClient[queryType](params).timeout(elasticsearch.timeout, 'elasticsearch timed out');
  }
};

module.exports = elasticsearch;
