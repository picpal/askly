-- 0002: Create users table + resolve circular FK with sessions
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  nickname    VARCHAR(50)  NOT NULL,
  role        VARCHAR(20)  DEFAULT 'participant',
  auth_id     UUID,
  joined_at   TIMESTAMPTZ  DEFAULT now()
);

-- Add FK for circular reference
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_creator
  FOREIGN KEY (creator_id) REFERENCES users(id);
