-- used for batch reindexing based on creation time
CREATE INDEX user_pages_created_at ON user_pages (created_at);
