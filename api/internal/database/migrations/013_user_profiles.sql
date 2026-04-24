CREATE TABLE user_profiles (
    id               TEXT        PRIMARY KEY,
    user_id          TEXT        NOT NULL UNIQUE,
    username         TEXT,
    avatar_url       TEXT,
    bio              TEXT,
    theme_preference TEXT        NOT NULL DEFAULT 'system',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
