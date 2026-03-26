-- 0008: Enable RLS on all tables + create policies (TRD Section 4.1)

-- ============================================================
-- sessions
-- ============================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read sessions
CREATE POLICY "sessions_select_all"
  ON sessions FOR SELECT
  USING (true);

-- INSERT: anyone can create a session
CREATE POLICY "sessions_insert_all"
  ON sessions FOR INSERT
  WITH CHECK (true);

-- UPDATE: only super_admin (checked via users table role)
CREATE POLICY "sessions_update_super_admin"
  ON sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND users.session_id = sessions.id
        AND users.role = 'super_admin'
    )
  );

-- DELETE: only super_admin
CREATE POLICY "sessions_delete_super_admin"
  ON sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND users.session_id = sessions.id
        AND users.role = 'super_admin'
    )
  );

-- ============================================================
-- users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT: users in the same session
CREATE POLICY "users_select_same_session"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.auth_id = auth.uid()
        AND u.session_id = users.session_id
    )
  );

-- INSERT: anyone can join a session
CREATE POLICY "users_insert_all"
  ON users FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- questions
-- ============================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- SELECT: public questions, or author's own, or admin/super_admin in the session
CREATE POLICY "questions_select_visible"
  ON questions FOR SELECT
  USING (
    is_private = FALSE
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND (
          users.id = questions.author_id
          OR (users.session_id = questions.session_id AND users.role IN ('admin', 'super_admin'))
        )
    )
  );

-- INSERT: session members only
CREATE POLICY "questions_insert_member"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND users.session_id = questions.session_id
    )
  );

-- UPDATE: author or admin/super_admin
CREATE POLICY "questions_update_author_or_admin"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND (
          users.id = questions.author_id
          OR (users.session_id = questions.session_id AND users.role IN ('admin', 'super_admin'))
        )
    )
  );

-- DELETE: author or admin/super_admin
CREATE POLICY "questions_delete_author_or_admin"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND (
          users.id = questions.author_id
          OR (users.session_id = questions.session_id AND users.role IN ('admin', 'super_admin'))
        )
    )
  );

-- ============================================================
-- answers
-- ============================================================
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read answers
CREATE POLICY "answers_select_all"
  ON answers FOR SELECT
  USING (true);

-- INSERT: admin or super_admin only
CREATE POLICY "answers_insert_admin"
  ON answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN questions ON questions.id = answers.question_id
      WHERE users.auth_id = auth.uid()
        AND users.session_id = questions.session_id
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: admin or super_admin only
CREATE POLICY "answers_update_admin"
  ON answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN questions ON questions.id = answers.question_id
      WHERE users.auth_id = auth.uid()
        AND users.session_id = questions.session_id
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- DELETE: admin or super_admin only
CREATE POLICY "answers_delete_admin"
  ON answers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN questions ON questions.id = answers.question_id
      WHERE users.auth_id = auth.uid()
        AND users.session_id = questions.session_id
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- ai_drafts
-- ============================================================
ALTER TABLE ai_drafts ENABLE ROW LEVEL SECURITY;

-- SELECT: admin only (INSERT/UPDATE handled by service_role, no RLS policy needed)
CREATE POLICY "ai_drafts_select_admin"
  ON ai_drafts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN questions ON questions.id = ai_drafts.question_id
      WHERE users.auth_id = auth.uid()
        AND users.session_id = questions.session_id
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- thumbs
-- ============================================================
ALTER TABLE thumbs ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can see thumbs
CREATE POLICY "thumbs_select_all"
  ON thumbs FOR SELECT
  USING (true);

-- INSERT: user_id must match the authenticated user
CREATE POLICY "thumbs_insert_own"
  ON thumbs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = thumbs.user_id
        AND users.auth_id = auth.uid()
    )
  );
