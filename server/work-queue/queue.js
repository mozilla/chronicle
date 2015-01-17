/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var nr = require('node-resque');
var Q = require('q');

var config = require('../config');
var log = require('../logger')('server.work-queue');
var jobs = require('./jobs');

var queueReady = Q.defer();
var workersReady = Q.defer();

var connectionDetails = {
  host: config.get('db.redis.host'),
  password: config.get('db.redis.password'),
  port: config.get('db.redis.port'),
  database: config.get('db.redis.database')
};

var queueOpts = { connection: connectionDetails };
var queue = new nr.queue(queueOpts, jobs, function onQueueReady() {
  log.info('queue started');
  // TODO listen for queue events?
  queueReady.resolve();
});

var multiWorkerOpts = {
  connection: connectionDetails,
  queues: ['chronicle'],
  minTaskProcessors: 1,
  maxTaskProcessors: 10,
};
var multiWorker = new nr.multiWorker(multiWorkerOpts, jobs, function() {
  multiWorker.on('start', function(workerId){
    log.debug('worker[' + workerId + '] started');
  });
  multiWorker.on('end', function(workerId){
    log.debug('worker[' + workerId + '] ended');
  });
  multiWorker.on('cleaning_worker', function(workerId, worker, pid){
    log.debug('cleaning old worker ' + worker);
  });
  multiWorker.on('poll', function(workerId, queue){
    log.verbose('worker[' + workerId + '] polling ' + queue);
  });
  multiWorker.on('job', function(workerId, queue, job){
    log.info('worker[' + workerId + '] working job ' + queue + ' ' + JSON.stringify(job));
  });
  multiWorker.on('reEnqueue', function(workerId, queue, job, plugin){
    log.verbose('worker[' + workerId + '] reEnqueue job (' + plugin + ') ' +
      queue + ' ' + JSON.stringify(job));
  });
  multiWorker.on('success', function(workerId, queue, job, result){
    // TODO do something with result?
    log.info('worker[' + workerId + '] job success ' + queue);
    log.verbose('worker[' + workerId + '] job success ' + queue + ' ' +
      JSON.stringify(job) + ' >> ' + result);
  });
  multiWorker.on('failure', function(workerId, queue, job, failure){
    log.warn('worker failed, job will be retried in 10 seconds');
    log.verbose('worker[' + workerId + '] job failure ' + queue + ' ' +
      JSON.stringify(job) + ' >> ' + failure);
    
    // TODO retry on failure
  });
  multiWorker.on('error', function(workerId, queue, job, error){
    log.warn('worker errored');
    log.verbose('worker[' + workerId + '] error ' + queue + ' ' +
      JSON.stringify(job) + ' >> ' + error);
    // TODO retry on failure
  });
  multiWorker.on('pause', function(workerId){
    log.verbose('worker[' + workerId + '] paused');
  });

  // multiWorker emitters
  multiWorker.on('internalError', function(error){
    log.warn('multiworker error: ' + error);
  });
  multiWorker.on('multiWorkerAction', function(verb, delay){
    log.verbose('*** checked for worker status: ' + verb +
      ' (event loop delay: ' + delay + 'ms)');
  });
  multiWorker.start();
  log.verbose('queue workers are ready');
  workersReady.resolve();
});

// TODO add reject handler when we listen for queue/worker startup failures
//Q.all([queueReady.promise, workersReady.promise]).then(function() {
// TODO: be fancy, loop over jobs
module.exports = {
  createVisit: function(o) {
    log.verbose('createVisit queue method invoked, o is ' + JSON.stringify(o));
    queue.enqueue('chronicle', 'createVisit', o);
  }
};
//});

process.on('SIGINT', function () {
  log.warn('process exiting, shutting down workers');
  multiWorker.stop();
  process.exit();
});
