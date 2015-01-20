/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var pg = require('pg-db');

var config = require('../config');
var log = require('../logger')('server.db.db');

var dbParams = {
  user: config.get('db.postgres.user'),
  password: config.get('db.postgres.password'),
  host: config.get('db.postgres.host'),
  port: config.get('db.postgres.port'),
  database: config.get('db.postgres.database'),
  ssl: config.get('db.postgres.ssl')
};

var db = pg(dbParams);

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

// DB API uses callbacks for the moment; TODO return promises?
// TODO validate DB inputs from the API at some point
// TODO if we get an unrecoverable error from a connection, we want to kill it,
// so that it is not returned to the pool (hapi-node-postgres suggestion).
//
// NOTE: we'll keep the DB dumb; if retry logic is needed, it can happen at app level
var user = {
  _normalize: function _normalize(r) {
    return {
      fxaId: r.fxaid,
      email: r.email
    };
  },
  create: function(fxaId, email, oauthToken, cb) {
    _verbose('db.user.create', fxaId, email, oauthToken);
    var query = 'INSERT INTO users (fxaId, email, oauthToken, createdAt) ' +
                'VALUES ($1, $2, $3, $4)';
    var args = [fxaId, email, oauthToken, new Date().toJSON()];

    db.query(query, args, function(err) {
      if (err) {
        log.warn('error saving user: ' + err);
      } else {
        _verbose('db.user.create succeeded');
      }
      cb(err);
    });
  },
  get: function(fxaId, cb) {
    _verbose('db.user.get called', fxaId);
    var query = 'SELECT fxaId, email FROM users WHERE fxaId = $1';
    var args = [fxaId];

    db.query(query, args, function(err, r) {
      if (err) {
        log.warn('error retrieving user: ' + err);
      } else {
        _verbose('db.user.get succeeded');
      }
      cb(err, r && user._normalize(r[0]));
    });
  },
  update: function(fxaId, email, oauthToken, cb) {
    _verbose('db.user.update', fxaId, email, oauthToken);
    var query = 'UPDATE users SET email = $1, oauthToken = $2, updatedAt = $3 ' +
                'WHERE fxaId = $4 RETURNING email, fxaId';
    var args = [email, oauthToken, new Date().toJSON(), fxaId];

    db.query(query, args, function(err, r) {
      if (err) {
        log.warn('error updating user: ' + err);
      } else {
        _verbose('db.user.update succeeded');
      }
      cb(err, r && user._normalize(r[0]));
    });
  }
};

var visit = {
  _normalize: function _normalize(r) {
    return {
      id: r.id,
      url: r.url,
      urlHash: r.urlhash,
      title: r.title,
      visitedAt: r.visitedat
    };
  },
  get: function(fxaId, visitId, cb) {
    _verbose('db.visit.get', fxaId, visitId);
    // important: postgres enforces that the user with id `fxaId` is the user with visit `visitId`
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE id = $1 AND fxaId = $2';
    var args = [visitId, fxaId];

    db.query(query, args, function(err, r) {
      if (err) {
        log.warn('error getting visit: ' + err);
      } else {
        _verbose('db.visit.get succeeded');
      }
      cb(err, r && visit._normalize(r[0]));
    });
  },
  // TODO if the url and visitedAt are the same, should we just discard the record?
  // ...maybe just deal with it later
  create: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    _verbose('db.visit.create', fxaId, visitId, visitedAt, url, title);
    var query = 'INSERT INTO visits (id, fxaId, rawUrl, url, urlHash, title, visitedAt) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7)';
    var args = [visitId, fxaId, url, url, urlHash, title, visitedAt];

    db.query(query, args, function(err) {
      if (err) {
        log.warn('error creating visit: ' + err);
      } else {
        _verbose('db.visit.create succeeded');
      }
      cb(err);
    });
  },
  update: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    _verbose('db.visit.update', fxaId, visitId, visitedAt, url, title);
    var query = 'UPDATE visits SET visitedAt = $1, updatedAt = $2, url = $3, ' +
                'urlHash = $4, rawUrl = $5, title = $6 ' +
                'WHERE fxaId = $7 AND id = $8 RETURNING id, fxaId, visitedAt, url, urlHash, title';
    var args = [visitedAt, new Date().toJSON(), url, urlHash, url, title, fxaId, visitId];

    db.query(query, args, function(err, r) {
      if (err) {
        log.warn('error updating visit: ' + err);
      } else {
        _verbose('db.visit.update succeeded');
      }
      cb(err, r && visit._normalize(r[0]));
    });
  },
  delete: function(fxaId, visitId, cb) {
    _verbose('db.visit.delete', fxaId, visitId);
    var query = 'DELETE FROM visits WHERE fxaId = $1 AND id = $2';
    var args = [fxaId, visitId];

    db.query(query, args, function(err) {
      if (err) {
        log.warn('error deleting visit: ' + err);
      } else {
        _verbose('db.visit.delete succeeded');
      }
      cb(err);
    });
  }
};

var visits = {
  _normalize: function _normalize(r) {
    var output = [];
    r.forEach(function(item) {
      output.push(visit._normalize(item));
    });
    return output;
  },
  getPaginated: function(fxaId, visitId, count, cb) {
    _verbose('db.visits.getPaginated', fxaId, visitId, count);
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE fxaId = $1 ' +
                'AND visitedAt < (SELECT visitedAt FROM visits WHERE id = $2) ' +
                'ORDER BY visitedAt DESC LIMIT $3';
    var args = [fxaId, visitId, count];

    db.query(query, args, function(err, results) {
      if (err) {
        log.warn('error getting paginated visits: ' + err);
      } else {
        _verbose('db.visits.getPaginated succeeded');
      }
      cb(err, results && visits._normalize(results));
    });
  },
  get: function(fxaId, count, cb) {
    _verbose('db.visits.get', fxaId, count);
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE fxaId = $1 ORDER BY visitedAt DESC LIMIT $2';
    var args = [fxaId, count];

    db.query(query, args, function(err, results) {
      if (err) {
        log.warn('error getting visits: ' + err);
      } else {
        _verbose('db.visits.get succeeded');
      }
      cb(err, results && visits._normalize(results));
    });
  }
};

module.exports = {
  user: user,
  visit: visit,
  visits: visits
};
