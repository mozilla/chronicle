/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var path = require('path');

var convict = require('convict');

var SEVEN_DAYS_IN_MSEC = 1000 * 60 * 60 * 24 * 7; // 7 days

var conf = convict({
  env: {
    doc: 'Application environment.',
    format: ['local', 'awsdev', 'prod', 'test'],
    default: 'local',
    env: 'NODE_ENV'
  },
  db: {
    elasticsearch: {
      host: {
        default: '127.0.0.1',
        env: 'ES_HOST',
        format: 'url'
      },
      port: {
        default: 9200,
        env: 'ES_PORT',
        format: 'port'
      }
    },
    mysql: {
      host: {
        default: '127.0.0.1',
        env: 'MYSQL_HOST',
        format: 'url'
      },
      port: {
        default: 3306,
        env: 'MYSQL_PORT',
        format: 'port'
      },
      user: {
        default: 'root',
        env: 'MYSQL_USERNAME',
        format: String
      },
      password: {
        default: '',
        env: 'MYSQL_PASSWORD',
        format: String
      },
      database: {
        doc: 'Name of the database.',
        default: 'chronicle',
        env: 'MYSQL_DATABASE',
        format: String
      },
      connectionLimit: {
        doc: 'Max number of MySQL workers in the pool.',
        default: 25,
        env: 'MYSQL_CONN_LIMIT',
        format: 'int'
      }
    },
    redis: {
      host: {
        default: '127.0.0.1',
        env: 'REDIS_HOST',
        format: 'url'
      },
      port: {
        default: 6379,
        env: 'REDIS_PORT',
        format: 'port'
      }
    }
  },
  server: {
    log: {
      doc: 'Mozlog configuration. Defaults currently target dev, not prod.',
      app: {
        doc: 'Top-level app name used in hierarchical logging, for example, "chronicle.db.mysql"',
        default: 'chronicle',
        format: String
      },
      level: {
        doc: 'Log messages with this or greater log level. Levels, in order, are: ' +
             'trace, verbose, debug, info, warn, error, critical.',
        default: 'debug',
        format: ['trace', 'verbose', 'debug', 'info', 'warn', 'error', 'critical']
      },
      fmt: {
        doc: 'Formatter. Use pretty for local dev, heka for production',
        default: 'pretty',
        format: ['pretty', 'heka']
      },
      debug: {
        doc: 'Extra checks that logger invocations are correct. Useful when developing',
        default: false,
        format: Boolean
      }
    },
    host: {
      doc: 'Host for the main api server process.',
      default: '127.0.0.1',
      format: 'url',
      env: 'HOST'
    },
    port: {
      doc: 'Port for the main api server process.',
      default: 8080,
      format: 'port',
      env: 'PORT'
    },
    staticPath: {
      doc: 'Path to static files.',
      default: 'dist',
      format: String,
      env: 'STATIC_PATH'
    },
    staticDirListing: {
      doc: 'Whether to allow directory listings for static dirs.',
      default: false,
      format: Boolean,
      env: 'STATIC_DIR_LISTING'
    },
    oauth: {
      clientId: {
        doc: 'Firefox Accounts client_id.',
        default: '5901bd09376fadaa',
        format: String,
        env: 'FXA_OAUTH_CLIENT_ID'
      },
      clientSecret: {
        doc: 'Firefox Accounts OAuth client_secret.',
        default: '4ab433e31ef3a7cf7c20590f047987922b5c9ceb1faff56f0f8164df053dd94c',
        format: String,
        env: 'FXA_OAUTH_CLIENT_SECRET'
      },
      scope: {
        doc: 'Application scope. Currently not checked by the auth server.',
        default: ['chronicle', 'profile'],
        format: Array,
        env: 'FXA_OAUTH_SCOPE'
      },
      version: {
        doc: 'OAuth version.',
        default: '2.0',
        format: String,
        env: 'FXA_OAUTH_VERSION'
      },
      protocol: {
        doc: 'OAuth authorization protocol used.',
        default: 'oauth2',
        format: String,
        env: 'FXA_OAUTH_AUTH_PROTOCOL'
      },
      redirectEndpoint: {
        doc: 'App endpoint to which OAuth flow redirects.',
        default: 'http://localhost:8080/auth/complete',
        format: 'url',
        env: 'FXA_OAUTH_REDIRECT_ENDPOINT'
      },
      authEndpoint: {
        doc: 'Firefox Accounts OAuth authorization endpoint.',
        default: 'https://oauth-latest.dev.lcip.org/v1/authorization',
        format: 'url',
        env: 'FXA_OAUTH_AUTH_ENDPOINT'
      },
      tokenEndpoint: {
        doc: 'Firefox Accounts OAuth token endpoint.',
        default: 'https://oauth-latest.dev.lcip.org/v1/token',
        format: 'url',
        env: 'FXA_OAUTH_TOKEN_ENDPOINT'
      },
      profileEndpoint: {
        doc: 'Firefox Accounts profile server endpoint, used to fetch email, fxa_id.',
        default: 'https://latest.dev.lcip.org/profile/v1/profile',
        format: 'url',
        env: 'FXA_PROFILE_ENDPOINT'
      }
    },
    session: {
      password: {
        doc: 'Password used to encrypt cookies with hueniverse-iron.',
        default: 'S3kr1t',
        format: String,
        env: 'SESSION_PASSWORD'
      },
      isSecure: {
        doc: 'Whether to allow cookie to be transmitted over insecure connections.',
        default: false,
        format: Boolean,
        env: 'SESSION_ALLOW_INSECURE_COOKIES'
      },
      duration: {
        doc: 'Default session TTL for authenticated users.',
        format: 'int',
        default: SEVEN_DAYS_IN_MSEC,
        env: 'SESSION_DURATION'
      }
    }
  }
});

// TODO copypasta from fxa-oauth-server. extract into a module? add to convict?
var envConfig = path.join(__dirname, '..', 'config', conf.get('env') + '.json');
var files = (envConfig + ',' + process.env.CONFIG_FILES)
  .split(',').filter(fs.existsSync);
conf.loadFile(files);
conf.validate();
module.exports = conf;
