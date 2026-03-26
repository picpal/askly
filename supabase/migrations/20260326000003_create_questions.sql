-- 0003: Create questions table
CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id        UUID         REFERENCES users(id),
  author_nickname  VARCHAR(50)  NOT NULL,
  content          TEXT         NOT NULL CHECK (char_length(content) <= 500),
  is_private       BOOLEAN      DEFAULT FALSE,
  thumb_count      INTEGER      DEFAULT 0,
  is_pinned        BOOLEAN      DEFAULT FALSE,
  created_at       TIMESTAMPTZ  DEFAULT now()
);
