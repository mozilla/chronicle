/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var pg = require('pg');

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

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

function onConnectionError(str, err, cb) {
  log.warn(str);
  log.trace(err);
  cb(err);
}

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
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, email, oauthToken, new Date().toJSON()], function(err) {
        if (err) {
          log.warn('error saving user: ' + err);
        } else {
          _verbose('db.user.create succeeded');
        }
        done();
        cb(err);
      });
    });
  },
  get: function(fxaId, cb) {
    _verbose('db.user.get called', fxaId);
    var query = 'SELECT fxaId, email FROM users WHERE fxaId = $1';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId], function(err, r) {
        if (err) {
          log.warn('error retrieving user: ' + err);
        } else {
          _verbose('db.user.get succeeded');
        }
        done();
        cb(err, r && user._normalize(r.rows[0]));
      });
    });
  },
  update: function(fxaId, email, oauthToken, cb) {
    _verbose('db.user.update', fxaId, email, oauthToken);
    var query = 'UPDATE users SET email = $1, oauthToken = $2, updatedAt = $3 ' +
                'WHERE fxaId = $4 RETURNING email, fxaId';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [email, oauthToken, new Date().toJSON(), fxaId], function(err, r) {
        if (err) {
          log.warn('error updating user: ' + err);
        } else {
          _verbose('db.user.update succeeded');
        }
        done();
        cb(err, r && user._normalize(r.rows[0]));
      });
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
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [visitId, fxaId], function(err, r) {
        if (err) {
          log.warn('error getting visit: ' + err);
        } else {
          _verbose('db.visit.get succeeded');
        }
        done();
        cb(err, r && visit._normalize(r.rows[0]));
      });
    });
  },
  // TODO if the url and visitedAt are the same, should we just discard the record?
  // ...maybe just deal with it later
  create: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    _verbose('db.visit.create', fxaId, visitId, visitedAt, url, title);
    var query = 'INSERT INTO visits (id, fxaId, rawUrl, url, urlHash, title, visitedAt) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7)';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [visitId, fxaId, url, url, urlHash, title, visitedAt], function(err, r) {
        if (err) {
          log.warn('error creating visit: ' + err);
        } else {
          _verbose('db.visit.create succeeded');
        }
        done();
        cb(err);
      });
    });
  },
  update: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    _verbose('db.visit.update', fxaId, visitId, visitedAt, url, title);
    var query = 'UPDATE visits SET visitedAt = $1, updatedAt = $2, url = $3, ' +
                'urlHash = $4, rawUrl = $5, title = $6 ' +
                'WHERE fxaId = $7 AND id = $8 RETURNING id, fxaId, visitedAt, url, urlHash, title';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [visitedAt, new Date().toJSON(), url, urlHash, url, title, fxaId, visitId],
        function(err, r) {
        if (err) {
          log.warn('error updating visit: ' + err);
        } else {
          _verbose('db.visit.update succeeded');
        }
        done();
        cb(err, r && visit._normalize(r.rows[0]));
      });
    });
  },
  delete: function(fxaId, visitId, cb) {
    _verbose('db.visit.delete', fxaId, visitId);
    var query = 'DELETE FROM visits WHERE fxaId = $1 AND id = $2';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, visitId], function(err) {
        if (err) {
          log.warn('error deleting visit: ' + err);
        } else {
          _verbose('db.visit.delete succeeded');
        }
        done();
        cb(err);
      });
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
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, visitId, count], function(err, results) {
        if (err) {
          log.warn('error getting paginated visits: ' + err);
        } else {
          _verbose('db.visits.getPaginated succeeded');
        }
        done();
        cb(err, results && visits._normalize(results.rows));
      });
    });
  },
  get: function(fxaId, count, cb) {
    _verbose('db.visits.get', fxaId, count);
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE fxaId = $1 ORDER BY visitedAt DESC LIMIT $2';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, count], function(err, results) {
        if (err) {
          log.warn('error getting visits: ' + err);
        } else {
          _verbose('db.visits.get succeeded');
        }
        done();
        cb(err, results && visits._normalize(results.rows));
      });
    });
  }
};

module.exports = {user: user, visit: visit, visits: visits};
