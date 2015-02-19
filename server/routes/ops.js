/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Q = require('q');
var es = require('elasticsearch');
var pg = require('pg');
var redis = require('redis');

var config = require('../config');

var pgParams = {
  user: config.get('db_postgres_user'),
  password: config.get('db_postgres_password'),
  host: config.get('db_postgres_host'),
  port: config.get('db_postgres_port'),
  database: config.get('db_postgres_database'),
  ssl: config.get('db_postgres_ssl')
};

var redisParams = {
  host: config.get('db_redis_host'),
  port: config.get('db_redis_port'),
  password: config.get('db_redis_password'),
  database: config.get('db_redis_database')
};

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

var pgCheck = function () {
  var deferred = Q.defer();
  pg.connect(pgParams, function(err, client, done) {
    done(); // Close database connection
    if (err) {
      return deferred.reject(err);
    }
    deferred.resolve();
  });
  return deferred.promise;
};

var esCheck = function () {
  var esClient = new es.Client(esParamsFactory());
  return esClient.ping({
    index: 'chronicle',
    type: 'visits'
  });
};

var redisCheck = function () {
  var deferred = Q.defer();
  var client = redis.createClient(redisParams.port, redisParams.host);
  client.on('connect', function () {
    client.quit();
    return deferred.resolve();
  });
  client.on('error', function (err) {
    client.quit();
    return deferred.reject(err);
  });
  return deferred.promise;
};

module.exports = [{
  method: 'GET',
  path: '/__heartbeat__',
  config: {
    handler: function (request, reply) {
      Q.all([
        pgCheck(),
        esCheck(),
        redisCheck()
      ]).then(function () {
        reply('ok').code(200);
      }, function (err) {
        reply(err.message).code(503);
      });
    },
    description: 'An endpoint for the OPs team to test server health.',
    tags: ['ops']
  }
}];
