-- 0006: Create thumbs table
CREATE TABLE thumbs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID  NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id      UUID  NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT thumbs_unique_per_user UNIQUE (question_id, user_id)
);
