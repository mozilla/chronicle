/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var q = require('q');
var config = require('../config');
var log = require('../logger')('server.db.reindex');
var postgres = require('./postgres');
var elasticsearch = require('./elasticsearch');
var isRunning = false;

// keys on the params object:
//  done - a callback to be fired when all done, or on unrecoverable error
//  startTime - time that reindexing started, used to ensure linear traversal through
//              user_pages in postgres
//  offset: number of records processed, used as postgres query OFFSET
//  stepSize: number of records processed per iteration, used as postgres LIMIT
//            (db_reindex_batchSize config value)
//  errorCount: number of sequential errors encountered; after a certain number, we
//              give up (db_reindex_maxRetries config value)
//  retryWait: base number of seconds to wait before post-error retry; multiplied by
//             the error count for linear backoff (db_reindex_retryWait config value)
//  maxRetries: number of sequential errors allowed before we bail
//              (db_reindex_maxRetries config value)
var job = function(params) {
  var pgResultCount, esResultCount;

  var extract_ = function() {
    var query = 'SELECT * FROM user_pages WHERE created_at < $1 ' +
                'ORDER BY created_at OFFSET $2 LIMIT $3';
    return postgres.query(query, [params.startTime, params.offset, params.stepSize])
      .fail(function(err) {
        log.warn(err);
        throw new Error('postgres extraction failed');
      });
  };

  var transform_ = function(results) {
    // edge case: if the number of postgres records is divisible by stepSize,
    // then the count will be 0 in the last iteration. unfortunately we have
    // to propagate this down the success handlers. TODO: find a better way
    results = results || [];
    // edge case: if there was 1 result, postgres returns a singleton object, we want an array
    if (!('length' in results)) {
      results = [results];
    }
    log.debug('results.length is ' + results.length);
    pgResultCount = results.length;
    var esParams = [];
    results.forEach(function(result) {
      // bulk API is a little funny, two parts:
      // 1. action description
      esParams.push({ index: { _index: 'chronicle', _type: 'userPages', _id: result.id } });
      // 2. document to index
      esParams.push(result);
    });
    log.debug('esParams.length is ' + esParams.length);
    return q(esParams);
  };

  var load_ = function(data) {
    log.debug('inside load_, data.length is ' + data.length);
    if (!data.length) {
      // this is the edge case where no results came back - we're done
      return q(0);
    }
    return elasticsearch.query('bulk', { body: data })
      .done(function(esResponse) {
        esResultCount = esResponse.items.length;
        log.debug('esResultCount is ' + esResultCount + ', pgResultCount is ' + pgResultCount);
        if (esResultCount === pgResultCount) {
          log.debug('esResultCount is ' + esResultCount);
          return q(esResultCount);
        } else {
          // something went wrong, try again
          throw new Error('result counts did not match');
        }
      }, function(err) {
        log.warn(err);
        throw new Error('elasticsearch insertion failed');
      });
  };

  q().timeout(config.get('db_reindex_timeout'))
    .then(extract_)
    .then(transform_)
    .then(load_)
    .done(function(result) {
      log.debug('completed an iteration');
      log.debug('result count from last iteration is ' + result);
      // if the number of results was smaller than the stepSize, then that
      // was the last step; we're done.
      if (result < params.stepSize) {
        isRunning = false;
        log.debug('last iteration processed ' + result + ' records, step size is ' + params.stepSize);
        log.info('reindexing complete');
        return params.done();
      }
      // else, update the offset counter, then call this function again.
      params.offset += params.stepSize;
      params.errorCount = 0;
      log.debug('reindexing another chunk, updated offset is now ' + params.offset);
      job(params);
    }, function(err) {
      log.warn(err);
      params.errorCount += 1;
      if (params.errorCount > params.maxRetries) {
        isRunning = false;
        var msg = 'reindexing failed too many times, aborting';
        log.critical(msg);
        return params.done(msg);
      }
      setTimeout(function() { job(params); }, params.errorCount * params.retryWait);
    });
};

function start(cb) {
  log.info('starting elasticsearch reindex process');
  if (isRunning) {
    var msg = 'reindex is already running';
    log.critical(msg);
    return cb(msg);
  }
  isRunning = true;
  elasticsearch.query('deleteByQuery', {
    index: 'chronicle',
    type: 'userPages',
    body: { query: { match_all: {} } }
  })
  .done(function() {
    log.info('reindex job deleted userPages, now starting to reindex');
    job({
      done: cb,
      startTime: new Date().toJSON(),
      offset: 0,
      errorCount: 0,
      stepSize: config.get('db_reindex_batchSize'),
      maxRetries: config.get('db_reindex_maxRetries'),
      retryWait: config.get('db_reindex_retryWait')
    });
  }, function(err) {
    var msg = 'reindex job could not delete userPages, aborting';
    log.critical(err);
    return cb(msg);
  });
}

module.exports = {
  start: start,
  isRunning: function() { return isRunning; }
};
