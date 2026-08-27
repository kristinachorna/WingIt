-- Initial schema for the camera-first messaging app

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(30) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  VARCHAR(50) NOT NULL,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

CREATE TABLE friendships (
    id            SERIAL PRIMARY KEY,
    requester_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        friendship_status NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (requester_id, recipient_id)
);

CREATE TABLE messages (
    id                   SERIAL PRIMARY KEY,
    sender_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_key            TEXT NOT NULL,        -- storage reference, not a public URL
    caption               TEXT,
    view_duration_seconds INTEGER NOT NULL DEFAULT 10,
    viewed_at             TIMESTAMPTZ,          -- set when recipient opens it
    expires_at            TIMESTAMPTZ,          -- set once viewed_at is set
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_friendships_recipient ON friendships(recipient_id);
