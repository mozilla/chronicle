/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Return version info based on package.json and the git hash
 *
 * We figure out the Git hash in the following order:
 *
 * (1) read config/version.json if exists (ie. staging, production)
 * (2) figure it out from git (either regular '.git', or
 *     '/home/app/git' for AwsBox)
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var exec = require('child_process').exec;

var Q = require('q');
var logger = require('mozlog')('server.ver.json');

var version = require('../../package.json').version;
var promise;

function getGitDir() {
  if (!fs.existsSync(path.join(__dirname, '..', '..', '.git'))) {
    // try at '/home/app/git' for AwsBox deploys
    return path.sep + path.join('home', 'app', 'git');
  }
}

function getCommitHashFromGit() {
  var deferred = Q.defer();

  var gitDir = getGitDir();
  var cmd = util.format('git %s rev-parse HEAD', gitDir ? '--git-dir=' + gitDir : '');

  exec(cmd, function (err, stdout) {
    deferred.resolve(stdout.replace(/\s+/, ''));
  });

  return deferred.promise;
}

function getCommitHashFromVersionJson() {
  return Q.fcall(function () {
    var configFile = path.join(__dirname, '..', '..', '..', 'config', 'version.json');
    if (fs.existsSync(configFile)) {
      var commitHash;
      try {
        commitHash = require(configFile).version.hash;
      } catch (e) {
        logger.error('could not read version.hash from version.json');
      }
      return commitHash;
    }
  });
}

function getVersionInfo() {
  // only resolve once, the data does not need to be re-calculated.
  if (promise) {
    return promise;
  }

  // (1) read config/version.json if exists (ie. staging, production)
  promise = getCommitHashFromVersionJson()
              .then(function (commitHash) {
                if (commitHash) {
                  return commitHash;
                }
                // (2) figure it out from git (either regular '.git',
                // or '/home/app/git' for AwsBox)
                return getCommitHashFromGit();
              })
              .then(function (commitHash) {
                logger.info('version set to: %s', version);
                logger.info('commit hash set to: %s', commitHash);
                return {
                  version: version,
                  commit: commitHash
                };
              });

  return promise;
}

// seed the info on startup.
getVersionInfo();

var verJsonController = {
  get: function (request, reply) {
      getVersionInfo().then(function (versionInfo) {
        // charset must be set on json responses.
        reply(versionInfo);
      });
    }
};

module.exports = verJsonController;
