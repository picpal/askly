-- Seed data for development
-- Note: Run after all migrations. Uses fixed UUIDs for reproducibility.

-- 1. Create session
INSERT INTO sessions (id, code, title, description, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'TEST01',
  'Test Session',
  'A test session for development purposes',
  TRUE
);

-- 2. Create users (super_admin, admin, participant)
INSERT INTO users (id, session_id, nickname, role) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'HostUser',    'super_admin'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ModeratorBot','admin'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Alice',       'participant');

-- 3. Set session creator
UPDATE sessions
SET creator_id = 'b0000000-0000-0000-0000-000000000001'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 4. Create questions
INSERT INTO questions (id, session_id, author_id, author_nickname, content) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Alice', 'What is the main goal of this project?'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Alice', 'How does the AI integration work?'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Alice', 'Can we export questions after the session?'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'ModeratorBot', 'Is there a limit on the number of participants?'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Alice', 'Will there be a mobile app version?');

-- 5. Create thumbs (reactions)
-- Alice thumbs questions 4, ModeratorBot thumbs questions 1 and 5
INSERT INTO thumbs (question_id, user_id) VALUES
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002');

-- 6. Create answers
INSERT INTO answers (question_id, author_id, content, source) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'The main goal is to provide a real-time Q&A platform with AI-assisted answer drafting for presenters and hosts.', 'manual'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'The AI integration uses Claude API to generate draft answers that the host can review and edit before publishing.', 'manual');
