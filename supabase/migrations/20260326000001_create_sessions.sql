-- 0001: Create sessions table
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(8)   UNIQUE NOT NULL,
  title           TEXT         NOT NULL,
  description     TEXT,
  creator_id      UUID,  -- FK added later (circular ref with users)
  ai_api_key_enc  TEXT,
  ai_provider     VARCHAR(20)  DEFAULT 'claude',
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMPTZ  DEFAULT now()
);
