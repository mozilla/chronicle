/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var path = require('path');

var convict = require('convict');

var conf = convict({
  env: {
    doc: 'Application environment.',
    format: ['local', 'awsdev', 'prod', 'test'],
    default: 'local',
    env: 'NODE_ENV'
  },
  testUser_enabled: {
    doc: 'If you want to create some records for a fake user, enable this option.',
    format: Boolean,
    default: false,
    env: 'TEST_USER_ENABLED'
  },
  testUser_id: {
    doc: 'fxa id (uuid minus dashes) identifying fake user',
    default: 'a6c9411418f94710a712ab97e7a3541c',
    format: String,
    env: 'TEST_USER_ID'
  },
  testUser_email: {
    doc: 'email address identifying fake user',
    default: 'fake_user@example.com',
    env: 'TEST_USER_EMAIL',
    format: String
  },
  db_elasticsearch_host: {
    default: '127.0.0.1',
    env: 'ES_HOST',
    format: 'url'
  },
  db_elasticsearch_port: {
    default: 9200,
    env: 'ES_PORT',
    format: 'port'
  },
  db_elasticsearch_queryTimeout: {
    doc: 'Milliseconds before app-level queries will bail',
    default: 15000,
    env: 'ES_TIMEOUT',
    format: 'int'
  },
  db_postgres_host: {
    doc: 'Name of host to connect to. Could be a socket or a URL.',
    default: 'localhost',
    env: 'PGHOST',
    format: String
  },
  db_postgres_port: {
    default: 5432,
    env: 'PGPORT',
    format: 'port'
  },
  db_postgres_user: {
    default: 'chronicle',
    env: 'PGUSER',
    format: String
  },
  db_postgres_database: {
    default: 'chronicle',
    env: 'PGDATABASE',
    format: String
  },
  db_postgres_password: {
    default: 'chronicle',
    env: 'PGPASSWORD',
    format: String
  },
  db_postgres_ssl: {
    doc: 'Require SSL for postgres connections.',
    default: false,
    format: Boolean
  },
  db_postgres_queryTimeout: {
    doc: 'Milliseconds before app-level queries will bail',
    default: 15000,
    env: 'PGTIMEOUT',
    format: 'int'
  },
  db_redis_host: {
    default: '127.0.0.1',
    env: 'REDIS_HOST',
    format: 'url'
  },
  db_redis_port: {
    default: 6379,
    env: 'REDIS_PORT',
    format: 'port'
  },
  db_redis_password: {
    default: '',
    env: 'REDIS_PASSWORD',
    format: String
  },
  db_redis_database: {
    default: 0,
    env: 'REDIS_DATABASE',
    format: 'int'
  },
  // TODO put these under a 'services' namespace
  embedly_enabled: {
    doc: 'Disable embedly for running on travis.',
    format: Boolean,
    default: true,
    env: 'EMBEDLY_ENABLED'
  },
  embedly_apiKey: {
    doc: 'Embedly API key',
    format: String,
    default: 'your_key_here',
    env: 'EMBEDLY_KEY'
  },
  avatarUrl: {
    doc: 'protocol-relative avatar service base url',
    // convict doesn't support protocol-relative urls
    format: String,
    default: '//gravatar.com/avatar/'
  },
  url2png_apiKey: {
    format: String,
    default: 'your_key_here'
  },
  url2png_secretKey: {
    format: String,
    default: 'your_key_here'
  },
  email_fromEmail: {
    format: 'email',
    default: 'info@chronicle.firefox.com'
  },
  email_smtp_host: {
    format: String,
    default: 'localhost'
  },
  email_smtp_port: {
    format: 'port',
    default: 25
  },
  email_smtp_auth_user: {
    format: String,
    default: ''
  },
  email_smtp_auth_pass: {
    format: String,
    default: ''
  },
  server_log_app: {
    doc: 'Top-level app name used in hierarchical logging, for example, "chronicle.db.postgres"',
    default: 'chronicle',
    format: String
  },
  server_log_level: {
    doc: 'Log messages with this or greater log level. Levels, in order, are: ' +
         'trace, verbose, debug, info, warn, error, critical.',
    default: 'debug',
    format: ['trace', 'verbose', 'debug', 'info', 'warn', 'error', 'critical']
  },
  server_log_fmt: {
    doc: 'Formatter. Use pretty for local dev, heka for production',
    default: 'pretty',
    format: ['pretty', 'heka']
  },
  server_log_debug: {
    doc: 'Extra checks that logger invocations are correct. Useful when developing',
    default: false,
    format: Boolean
  },
  server_host: {
    doc: 'Host for the main api server process.',
    default: '127.0.0.1',
    format: 'url',
    env: 'HOST'
  },
  server_port: {
    doc: 'Port for the main api server process.',
    default: 8080,
    format: 'port',
    env: 'PORT'
  },
  server_staticPath: {
    doc: 'Path to static files.',
    default: 'public',
    format: String,
    env: 'STATIC_PATH'
  },
  server_staticDirListing: {
    doc: 'Whether to allow directory listings for static dirs.',
    default: false,
    format: Boolean,
    env: 'STATIC_DIR_LISTING'
  },
  server_oauth_clientId: {
    doc: 'Firefox Accounts client_id.',
    default: '5901bd09376fadaa',
    format: String,
    env: 'FXA_OAUTH_CLIENT_ID'
  },
  server_oauth_clientSecret: {
    doc: 'Firefox Accounts OAuth client_secret.',
    default: '4ab433e31ef3a7cf7c20590f047987922b5c9ceb1faff56f0f8164df053dd94c',
    format: String,
    env: 'FXA_OAUTH_CLIENT_SECRET'
  },
  server_oauth_scope: {
    doc: 'Application scope. Currently not checked by the auth server.',
    default: ['chronicle', 'profile'],
    format: Array,
    env: 'FXA_OAUTH_SCOPE'
  },
  server_oauth_version: {
    doc: 'OAuth version.',
    default: '2.0',
    format: String,
    env: 'FXA_OAUTH_VERSION'
  },
  server_oauth_protocol: {
    doc: 'OAuth authorization protocol used.',
    default: 'oauth2',
    format: String,
    env: 'FXA_OAUTH_AUTH_PROTOCOL'
  },
  server_oauth_redirectEndpoint: {
    doc: 'App endpoint to which OAuth flow redirects.',
    default: 'http://localhost:8080/auth/complete',
    format: 'url',
    env: 'FXA_OAUTH_REDIRECT_ENDPOINT'
  },
  server_oauth_authEndpoint: {
    doc: 'Firefox Accounts OAuth authorization endpoint.',
    default: 'https://oauth-latest.dev.lcip.org/v1/authorization',
    format: 'url',
    env: 'FXA_OAUTH_AUTH_ENDPOINT'
  },
  server_oauth_tokenEndpoint: {
    doc: 'Firefox Accounts OAuth token endpoint.',
    default: 'https://oauth-latest.dev.lcip.org/v1/token',
    format: 'url',
    env: 'FXA_OAUTH_TOKEN_ENDPOINT'
  },
  server_oauth_profileEndpoint: {
    doc: 'Firefox Accounts profile server endpoint, used to fetch email, user_id.',
    default: 'https://latest.dev.lcip.org/profile/v1/profile',
    format: 'url',
    env: 'FXA_PROFILE_ENDPOINT'
  },
  server_session_password: {
    doc: 'Password used to encrypt cookies with hueniverse-iron.',
    default: 'S3kr1t',
    format: String,
    env: 'SESSION_PASSWORD'
  },
  server_session_isSecure: {
    doc: 'Whether to allow cookie to be transmitted over insecure connections.',
    default: false,
    format: Boolean,
    env: 'SESSION_ALLOW_INSECURE_COOKIES'
  },
  server_session_duration: {
    doc: 'Session duration in milliseconds. Zero, the default, means session cookie.',
    format: 'int',
    default: 0,
    env: 'SESSION_DURATION'
  },
  server_session_cookieName: {
    doc: 'Name of session cookie.',
    default: 'sid',
    format: String,
    env: 'SESSION_COOKIE_NAME'
  },
  server_session_clearInvalid: {
    doc: 'Whether to expire cookies that fail validation.',
    default: true,
    format: Boolean,
    env: 'SESSION_COOKIE_CLEAR_INVALID'
  }
});

// TODO copypasta from fxa-oauth-server. extract into a module? add to convict?
var envConfig = path.join(__dirname, '..', 'config', conf.get('env') + '.json');
var files = (envConfig + ',' + process.env.CONFIG_FILES)
  .split(',').filter(fs.existsSync);
conf.loadFile(files);
conf.validate();
module.exports = conf;
