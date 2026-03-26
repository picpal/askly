-- 0007: Create indexes (TRD Section 2.3)
CREATE INDEX idx_questions_session_id   ON questions(session_id);
CREATE INDEX idx_questions_created_at   ON questions(created_at DESC);
CREATE INDEX idx_questions_thumb_count  ON questions(thumb_count DESC);
CREATE INDEX idx_answers_question_id    ON answers(question_id);
CREATE INDEX idx_ai_drafts_question_id  ON ai_drafts(question_id);
CREATE INDEX idx_thumbs_question_id     ON thumbs(question_id);
CREATE INDEX idx_users_session_id       ON users(session_id);
CREATE INDEX idx_users_auth_id          ON users(auth_id);
