/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

// TODO we should probably remove the elasticsearch-js library, it is garbage
var es = require('elasticsearch');
var Q = require('q');

var config = require('../config');
var log = require('../logger')('server.db.elasticsearch');
var logLevel = config.get('server_log_level');

// elasticsearch doesn't have a verbose level, so shift to debug as needed
if (logLevel === 'verbose') { logLevel = 'debug'; }

// >:-(
// https://github.com/elasticsearch/elasticsearch-js/issues/33
var esParamsFactory = function() {
  return {
    host: {
      host: config.get('db_elasticsearch_host'),
      port: config.get('db_elasticsearch_port')
    },
    log: logLevel,
    // doesn't seem to actually disable keepalives, just allows client to
    // close when http times out (15 sec). if not disabled, the process
    // will hang forever and have to be manually killed!
    keepAlive: false
  };
};

var esClient = new es.Client(esParamsFactory());
var timeout = config.get('db_elasticsearch_queryTimeout');

var elasticsearch = {
  // query elasticsearch; returns a promise
  //
  // queryType := es client API method, for example, 'create'
  // params := es query DSL object
  query: function query(queryType, params) {
    // force promises to eventually resolve
    // NOTE: I checked, elasticsearch uses bluebird, which supports Promise.timeout ^_^
    return esClient[queryType](params).timeout(timeout, 'elasticsearch timed out');
  }
};

module.exports = elasticsearch;
