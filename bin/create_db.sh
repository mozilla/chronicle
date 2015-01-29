#!/bin/bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# TODO convert to node when things slow down

# Accept user for psql as first parameter but default to the current user
# ./create_db.sh postgres
PSQLUSER=${1-$USER}

psql -c 'DROP DATABASE IF EXISTS chronicle;' -U $PSQLUSER
psql -c "REASSIGN OWNED BY chronicle TO $PSQLUSER;" -U $PSQLUSER
psql -c 'DROP USER IF EXISTS chronicle;' -U $PSQLUSER

psql -c "CREATE USER chronicle WITH PASSWORD 'chronicle';" -U $PSQLUSER
psql -c "CREATE DATABASE chronicle ENCODING 'UTF-8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';" -U $PSQLUSER
psql -c 'GRANT ALL PRIVILEGES ON DATABASE chronicle to chronicle;' -U $PSQLUSER
psql -c 'ALTER SCHEMA public OWNER TO chronicle;' -U $PSQLUSER
psql -c "CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(32) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  oauth_token TEXT,
  created_at TIMESTAMPTZ(3) NOT NULL,
  updated_at TIMESTAMPTZ(3) NOT NULL
);" -d chronicle -U chronicle
psql -c "CREATE TABLE IF NOT EXISTS user_pages (
  id UUID PRIMARY KEY,
  user_id CHAR(32) REFERENCES users(user_id),
  url VARCHAR(2048) NOT NULL,
  raw_url VARCHAR(2048) NOT NULL,
  url_hash CHAR(40) NOT NULL,
  title TEXT NOT NULL,
  extracted_at TIMESTAMPTZ(3),
  extracted_author_name TEXT,
  extracted_author_url VARCHAR(2048),
  extracted_cache_age BIGINT,
  extracted_content TEXT,
  extracted_description TEXT,
  extracted_favicon_color TEXT,
  extracted_favicon_url VARCHAR(2048),
  extracted_image_caption TEXT,
  extracted_image_color TEXT,
  extracted_image_entropy DOUBLE PRECISION,
  extracted_image_height INTEGER,
  extracted_image_url VARCHAR(2048),
  extracted_image_width INTEGER,
  extracted_language TEXT,
  extracted_lead TEXT,
  extracted_media_duration INTEGER,
  extracted_media_height INTEGER,
  extracted_media_html TEXT,
  extracted_media_type TEXT,
  extracted_media_width INTEGER,
  extracted_provider_display TEXT,
  extracted_provider_name TEXT,
  extracted_provider_url VARCHAR(2048),
  extracted_published TIMESTAMPTZ(3),
  extracted_safe BOOLEAN,
  extracted_title TEXT,
  extracted_type TEXT,
  extracted_url VARCHAR(2048),
  created_at TIMESTAMPTZ(3) NOT NULL,
  updated_at TIMESTAMPTZ(3) NOT NULL
);" -d chronicle -U chronicle
psql -c "CREATE UNIQUE INDEX user_pages_url_hash_user_id
  ON user_pages (url_hash, user_id);" -d chronicle -U chronicle
psql -c "CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY,
  user_id CHAR(32) NOT NULL REFERENCES users,
  user_page_id UUID NOT NULL REFERENCES user_pages(id),
  visited_at TIMESTAMPTZ(3) NOT NULL,
  updated_at TIMESTAMPTZ(3) NOT NULL
);" -d chronicle -U chronicle
psql -c "CREATE UNIQUE INDEX user_id_visited_at_id
  ON visits (user_id, visited_at, id);" -d chronicle -U chronicle
# used to check if a user_page should be deleted on visit delete
psql -c "CREATE UNIQUE INDEX user_id_user_page_id_id
  ON visits (user_id, user_page_id, id);" -d chronicle -U chronicle

# lest we forget! clean out our elasticsearch index, too
curl -XDELETE 'http://localhost:9200/chronicle/'
curl -XPUT 'http://localhost:9200/chronicle/'
