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
  user: config.get('db.postgres.user'),
  password: config.get('db.postgres.password'),
  host: config.get('db.postgres.host'),
  port: config.get('db.postgres.port'),
  database: config.get('db.postgres.database'),
  ssl: config.get('db.postgres.ssl')
};

var redisParams = {
  host: config.get('db.redis.host'),
  port: config.get('db.redis.port'),
  password: config.get('db.redis.password'),
  database: config.get('db.redis.database')
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
    }
  }
}];
