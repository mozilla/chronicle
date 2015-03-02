/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';



var kue = require('kue');

var config = require('../config');
var log = require('../logger')('server.work-queue');
var workers = require('./jobs');

// high-level TODOs:
// TODO use OOP, ES5 Object.create is fine. Just pick something and get on w/it.
// TODO use cluster support to fork additional processes:
//      https://github.com/learnboost/kue#parallel-processing-with-cluster
// TODO handle resuming dropped jobs across process restarts


// startup


var _queue = kue.createQueue({
  redis: {
    host: config.get('db_redis_host'),
    password: config.get('db_redis_password'),
    port: config.get('db_redis_port'),
    db: config.get('db_redis_database')
  }
});


// shutdown / process mgmt


var onUncaughtException = function(err) {
  log.warn('uncaught exception caught at process level, doh!', err);
};

var onShutdown = function(signal) {
  log.info('signal ' + signal + ' received, queue exiting when all jobs complete...');
  _queue.shutdown(function(err) {
    log.info('all jobs complete, queue exiting');
  });
};

process.on('uncaughtException', onUncaughtException);
process.once('SIGINT', onShutdown.bind('SIGINT'));
process.once('SIGTERM', onShutdown.bind('SIGTERM'));
process.once('exit', onShutdown.bind('exit'));


// job management


var _removeJob = function(id) {
  // TODO check if it's an id or a job, don't get the job twice
  kue.Job.get(id, function(err, job) {
    if (err) { return; }
    job.remove(function(err) {
      if (err) {
        log.warn('error removing job ' + job.id, err);
        // TODO: add to a cleanup queue? what possible errors could occur here?
      }
      log.info('removed job ' + job.id);
    });
  });
};

var onJobComplete = function(id, result) {
  log.info('queue.job.completed', {id: id});
  _removeJob(id);
};

var onJobFailed = function(id) {
  log.warn('queue.job.failed', {id: id});
  kue.Job.get(id, function(err, job) {
    if (err) { return; }
    log.verbose('queue.job.failed.err', {id: id, err: job.error});
    _removeJob(id);
  });
};

var onJobError = function(id, err) {
  log.warn('queue.job.error', {id: id});
  kue.Job.get(id, function(err, job) {
    if (err) { return; }
    log.verbose('queue.job.error.err', {id: id, err: job.error});
    _removeJob(id);
  });
};

var onJobRetry = function(id) {
  log.info('queue.job.retrying', {id: id});
  kue.Job.get(id, function(err, job) {
    if (err) { return; }
    log.verbose('queue.job.retry.err', {id: id, err: job.error});
  });
};

var onJobEnqueued = function(id) {
  log.info('queue.job.enqueued', {id: id});
};

var onJobProgress = function(id, completed, total) {
  log.info('queue.job.progress', {id: id, completed: completed, total: total});
};

_queue.on('job complete', onJobComplete);
_queue.on('job failed', onJobFailed);
_queue.on('job error', onJobError);
_queue.on('job failed attempt', onJobRetry);
_queue.on('job enqueue', onJobEnqueued);
_queue.on('job progress', onJobProgress);


// job creation


// TODO allow job creation to set priorities; we're setting priority here for the moment
// opts := { priority, data }
// priority := 'low' | 'normal' | 'medium' | 'high' | 'critical'
// data := data passed to the worker to run the job
var exported = {
  enqueue: function(job, data, priority) {
    log.debug(job + '.called');
    _queue.create(job, data)
      .priority(priority)
      .save();
  },
  createVisit: function(opts) {
    exported.enqueue('createVisit', opts.data, opts.priority || 'high');
  },
  extractPage: function(opts) {
    exported.enqueue('extractPage', opts.data, opts.priority || 'medium');
  },
  sendWelcomeEmail: function(opts) {
    exported.enqueue('sendWelcomeEmail', opts.data, opts.priority || 'low');
  }
};


// job processing


// let's start with 10 workers per job (TODO put this in a config somewhere)
workers.createVisit.work(_queue);
workers.extractPage.work(_queue);
workers.sendWelcomeEmail.work(_queue);

module.exports = exported;
