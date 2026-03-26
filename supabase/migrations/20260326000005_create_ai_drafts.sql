-- 0005: Create ai_drafts table
CREATE TABLE ai_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content      TEXT,
  status       VARCHAR(20)  DEFAULT 'pending',
  model        VARCHAR(50),
  error_msg    TEXT,
  created_at   TIMESTAMPTZ  DEFAULT now()
);
