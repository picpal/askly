-- 0004: Create answers table
CREATE TABLE answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id     UUID         NOT NULL REFERENCES users(id),
  content       TEXT         NOT NULL,
  source        VARCHAR(20)  DEFAULT 'manual',
  show_ai_badge BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT now(),
  updated_at    TIMESTAMPTZ
);
