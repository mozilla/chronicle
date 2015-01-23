/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');
var pg = require('pg');
var es = require('elasticsearch');

var config = require('../config');

var dbParams = {
  user: config.get('db.postgres.user'),
  password: config.get('db.postgres.password'),
  host: config.get('db.postgres.host'),
  port: config.get('db.postgres.port'),
  database: config.get('db.postgres.database'),
  ssl: config.get('db.postgres.ssl')
};

// >:-(
// https://github.com/elasticsearch/elasticsearch-js/issues/33
var esParamsFactory = function() {
  return {
    host: {
      host: config.get('db.elasticsearch.host'),
      post: config.get('db.elasticsearch.port'),
      log: 'verbose'
    }
  };
};

var pgCheck = function () {
  var deferred = Q.defer();
  pg.connect(dbParams, function(err, client, done) {
    done(); // Close database connection
    if (err) {
      return deferred.reject(err);
    }
    deferred.resolve();
  });
  return deferred.promise;
};

var esCheck = function () {
  var deferred = Q.defer();
  var esClient = new es.Client(esParamsFactory());
  esClient.search({
    index: 'chronicle',
    type: 'visits',
    size: 0,
    body: {}
  }).then(deferred.resolve, deferred.reject).catch(deferred.reject);
  return deferred.promise;
};

module.exports = [{
  method: 'GET',
  path: '/__heartbeat__',
  config: {
    handler: function (request, reply) {
      Q.all([
        pgCheck(),
        esCheck()
      ]).then(function (results) {
        reply('ok').code(200);
      }, function (err) {
        reply(err.message).code(503);
      }).catch(function (err) {
        reply(err.message).code(503);
      });
    }
  }
}];
