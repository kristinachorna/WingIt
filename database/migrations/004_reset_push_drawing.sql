-- Adds support for: password reset, push notifications, and drawing overlays.

ALTER TABLE users
    ADD COLUMN reset_token_hash TEXT,
    ADD COLUMN reset_token_expires_at TIMESTAMPTZ,
    ADD COLUMN push_token TEXT;

ALTER TABLE messages
    ADD COLUMN drawing_data TEXT;  -- JSON-encoded array of SVG path strings, nullable
