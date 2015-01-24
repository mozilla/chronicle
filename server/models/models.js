/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var pg = require('pg');
var es = require('elasticsearch');

var config = require('../config');
var log = require('../logger')('server.models');

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
    _verbose('models.user.create', fxaId, email, oauthToken);
    var query = 'INSERT INTO users (fxaId, email, oauthToken, createdAt) ' +
                'VALUES ($1, $2, $3, $4)';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, email, oauthToken, new Date().toJSON()], function(err) {
        if (err) {
          log.warn('error saving user: ' + err);
        } else {
          _verbose('models.user.create succeeded');
        }
        done();
        cb(err);
      });
    });
  },
  get: function(fxaId, cb) {
    _verbose('models.user.get called', fxaId);
    var query = 'SELECT fxaId, email FROM users WHERE fxaId = $1';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId], function(err, r) {
        if (err) {
          log.warn('error retrieving user: ' + err);
        } else {
          _verbose('models.user.get succeeded');
        }
        done();
        cb(err, r && user._normalize(r.rows[0]));
      });
    });
  },
  update: function(fxaId, email, oauthToken, cb) {
    _verbose('models.user.update', fxaId, email, oauthToken);
    var query = 'UPDATE users SET email = $1, oauthToken = $2, updatedAt = $3 ' +
                'WHERE fxaId = $4 RETURNING email, fxaId';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [email, oauthToken, new Date().toJSON(), fxaId], function(err, r) {
        if (err) {
          log.warn('error updating user: ' + err);
        } else {
          _verbose('models.user.update succeeded');
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
    _verbose('models.visit.get', fxaId, visitId);
    // important: postgres enforces that the user with id `fxaId` is the user with visit `visitId`
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE id = $1 AND fxaId = $2';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [visitId, fxaId], function(err, r) {
        if (err) {
          log.warn('error getting visit: ' + err);
        } else {
          _verbose('models.visit.get succeeded');
        }
        done();
        cb(err, r && visit._normalize(r.rows[0]));
      });
    });
  },
  create: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    _verbose('models.visit.create', fxaId, visitId, visitedAt, url, title);
    var query = 'INSERT INTO visits (id, fxaId, rawUrl, url, urlHash, title, visitedAt) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7)';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [visitId, fxaId, url, url, urlHash, title, visitedAt], function(err, r) {
        done();
        if (err) {
          log.warn('error creating visit: ' + err);
          return cb(err);
        }
        // postgres succeeded, now insert into elasticsearch
        var esClient = new es.Client(esParamsFactory());
        esClient.create({
          index: 'chronicle',
          type: 'visits',
          id: visitId,
          body: {
            id: visitId,
            fxaId: fxaId,
            url: url,
            urlHash: urlHash,
            title: title,
            visitedAt: visitedAt
          }
        }).then(function() {
          _verbose('models.visit.create succeeded');
          cb();
        }, function (err) {
          log.warn('error adding visit to elasticsearch: ' + err);
          cb(err);
        });
      });
    });
  },
  update: function(fxaId, visitId, visitedAt, url, urlHash, title, cb) {
    _verbose('models.visit.update', fxaId, visitId, visitedAt, url, title);
    var query = 'UPDATE visits SET visitedAt = $1, updatedAt = $2, url = $3, ' +
                'urlHash = $4, rawUrl = $5, title = $6 ' +
                'WHERE fxaId = $7 AND id = $8 RETURNING id, fxaId, visitedAt, url, urlHash, title';
    var updatedAt = new Date().toJSON();
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [visitedAt, updatedAt, url, urlHash, url, title, fxaId, visitId],
        function(err, r) {
        done();
        if (err) {
          log.warn('error updating visit: ' + err);
          return cb(err);
        }
        // postgres succeeded, now update in elasticsearch
        // NOTE! we don't verify that user owns visit in ES, but postgres
        // should already have failed in that case
        var esClient = new es.Client(esParamsFactory());
        esClient.update({
          index: 'chronicle',
          type: 'visits',
          id: visitId,
          body: {
            id: visitId,
            fxaId: fxaId,
            rawUrl: url,
            url: url,
            urlHash: urlHash,
            title: title,
            visitedAt: visitedAt,
            updatedAt: updatedAt
          }
        }).then(function() {
          _verbose('models.visit.update succeeded');
          cb(err, r && visit._normalize(r.rows[0]));
        }, function (err) {
          log.warn('error updating visit in elasticsearch: ' + err);
          cb(err);
        });
      });
    });
  },
  delete: function(fxaId, visitId, cb) {
    _verbose('models.visit.delete', fxaId, visitId);
    var query = 'DELETE FROM visits WHERE fxaId = $1 AND id = $2';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, visitId], function(err) {
        done();
        if (err) {
          log.warn('error deleting visit: ' + err);
          return cb(err);
        }
        // postgres succeeded, now delete from elasticsearch
        var esClient = new es.Client(esParamsFactory());
        // NOTE! we don't verify that user owns visit in ES, but postgres
        // should already have failed in that case
        esClient.delete({
          index: 'chronicle',
          type: 'visits',
          id: visitId
        }).then(function() {
          _verbose('models.visit.delete succeeded');
          cb();
        }, function(err) {
          log.warn('error deleting visit in elasticsearch: ' + err);
          cb(err);
        });
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
    _verbose('models.visits.getPaginated', fxaId, visitId, count);
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
          _verbose('models.visits.getPaginated succeeded');
        }
        done();
        cb(err, results && visits._normalize(results.rows));
      });
    });
  },
  get: function(fxaId, count, cb) {
    _verbose('models.visits.get', fxaId, count);
    var query = 'SELECT id, url, urlHash, title, visitedAt ' +
                'FROM visits WHERE fxaId = $1 ORDER BY visitedAt DESC LIMIT $2';
    pg.connect(dbParams, function(err, client, done) {
      if (err) { return onConnectionError(err, cb); }
      client.query(query, [fxaId, count], function(err, results) {
        if (err) {
          log.warn('error getting visits: ' + err);
        } else {
          _verbose('models.visits.get succeeded');
        }
        done();
        cb(err, results && visits._normalize(results.rows));
      });
    });
  },
  search: function(fxaId, searchTerm, count, cb) {
    _verbose('models.visits.search', fxaId, count);
    var esClient = new es.Client(esParamsFactory());
    esClient.search({
      index: 'chronicle',
      type: 'visits',
      size: count,
      body: {
        query: {
          bool: {
            must: {term: {fxaId: fxaId}},
            should: {term: {title: searchTerm}}
          }
        }
      }
    })
    .then(function(resp) {
      var output = {};
      output.resultCount = resp.hits.total;
      if (!!resp.hits.total) {
        output.results = resp.hits.hits.map(function(item) {
          // TODO: this is quite similar to the visit._normalize function,
          // except for downcasing. what's the cleanest way to formalize the
          // contract between API layers and these 2 databases? it should lead
          // naturally to API docs, I'd think.
          // TODO we might also want to return relevance scores or other special
          // elasticsearch bits as part of this API
          var s = item._source;
          return {
            id: s.id,
            fxaId: s.fxaId,
            title: s.title,
            url: s.url,
            urlHash: s.urlHash,
            visitedAt: s.visitedAt
          };
        });
      }
      _verbose('models.visits.search succeeded');
      cb(null, output);
    }, function failed(err) {
      log.warn(err);
      cb(err);
    });
  }
};

module.exports = {user: user, visit: visit, visits: visits};
