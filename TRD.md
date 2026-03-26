# TRD — Askly: Real-Time Q&A Platform

> **Version:** 1.0 | **Date:** 2026-03-26 | **Status:** Draft (Pending Review)
> **Audience:** Engineering team, architects
> **Related:** [PRD.md](./PRD.md)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Design](#2-database-design)
3. [API Design](#3-api-design)
4. [Security & Access Control](#4-security--access-control)
5. [Frontend Architecture](#5-frontend-architecture)
6. [AI Integration](#6-ai-integration)
7. [Real-Time Communication](#7-real-time-communication)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Development Schedule](#9-development-schedule-phase-1)
10. [Technical Risks](#10-technical-risks)

---

## 1. System Architecture

### 1.1 Tech Stack (Free-Tier Based)

All services below operate fully within their free plans. The architecture is serverless to support auto-scaling without cost.

| Layer | Technology | Free Plan Limit |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Vercel Free: 100 GB bandwidth/month |
| Backend API | Next.js API Routes (serverless) | Vercel Free: 100k invocations/month |
| Database | Supabase PostgreSQL | 500 MB DB, 2 GB bandwidth/month |
| Real-Time | Supabase Realtime (WebSocket) | 200 concurrent connections |
| QR Code | qrcode.react (client-side) | Free (library, no server cost) |
| AI API | Anthropic Claude API (admin's key) | Zero platform cost — admin pays own usage |
| Auth | Supabase Auth (anonymous sessions) | Included in Supabase Free |
| CDN / Edge | Vercel Edge Network | Included in Vercel Free |

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           Browser (Mobile / Desktop)        │
│              Next.js 14 SPA                 │
└──────────┬──────────────┬───────────────────┘
           │ HTTPS/REST   │ WebSocket
           ▼              ▼
┌──────────────────┐  ┌──────────────────────┐
│  Vercel Edge     │  │  Supabase Realtime   │
│  API Routes      │  │  (postgres_changes)  │
└────────┬─────────┘  └──────────┬───────────┘
         │                       │
         ▼                       ▼
┌──────────────────────────────────────────────┐
│             Supabase PostgreSQL               │
│  sessions | users | questions | answers      │
│  ai_drafts | thumbs                          │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  Anthropic /     │
│  OpenAI API      │
│  (Admin Key)     │
└──────────────────┘
```

### 1.3 Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth strategy | Supabase anonymous auth | No registration required; JWT carries role claims |
| Real-time transport | Supabase Realtime (WebSocket) | Built-in with Supabase; no extra infra |
| AI cost model | Admin-supplied API key | Zero platform cost; admin controls spend |
| State management | Zustand + TanStack Query | Lightweight; optimistic updates support |
| Styling | Tailwind CSS | Utility-first; no build-time overhead |

---

## 2. Database Design

### 2.1 Entity Relationship Overview

```
sessions ──< users
sessions ──< questions ──< answers
questions ──< thumbs (user_id UNIQUE per question)
questions ──< ai_drafts
```

### 2.2 Table Definitions

#### `sessions` — Session (Room) Info

```sql
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(8)   UNIQUE NOT NULL,      -- 6-char invite code (URL-safe)
  title           TEXT         NOT NULL,
  description     TEXT,
  creator_id      UUID         REFERENCES users(id),
  ai_api_key_enc  TEXT,                              -- AES-256-GCM encrypted API key
  ai_provider     VARCHAR(20)  DEFAULT 'claude',     -- 'claude' | 'openai'
  expires_at      TIMESTAMPTZ,                       -- NULL = no expiry
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMPTZ  DEFAULT now()
);
```

#### `users` — Session Participants

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  nickname    VARCHAR(50)  NOT NULL,
  role        VARCHAR(20)  DEFAULT 'participant',   -- 'super_admin' | 'admin' | 'participant'
  auth_id     UUID,                                 -- Supabase Auth anonymous UID
  joined_at   TIMESTAMPTZ  DEFAULT now()
);
```

#### `questions` — Questions

```sql
CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id        UUID         REFERENCES users(id),
  author_nickname  VARCHAR(50)  NOT NULL,            -- snapshot at submission time
  content          TEXT         NOT NULL CHECK (char_length(content) <= 500),
  is_private       BOOLEAN      DEFAULT FALSE,
  thumb_count      INTEGER      DEFAULT 0,           -- denormalized cache
  is_pinned        BOOLEAN      DEFAULT FALSE,
  created_at       TIMESTAMPTZ  DEFAULT now()
);
```

#### `answers` — Admin Answers (publicly visible)

```sql
CREATE TABLE answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id    UUID         NOT NULL REFERENCES users(id),
  content      TEXT         NOT NULL,
  source       VARCHAR(20)  DEFAULT 'manual',       -- 'manual' | 'ai_assisted'
  show_ai_badge BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ  DEFAULT now(),
  updated_at   TIMESTAMPTZ
);
```

#### `ai_drafts` — AI Answer Drafts (admin-only)

```sql
CREATE TABLE ai_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content      TEXT,
  status       VARCHAR(20)  DEFAULT 'pending',  -- 'pending' | 'generating' | 'done' | 'failed'
  model        VARCHAR(50),                     -- e.g. 'claude-sonnet-4-5'
  error_msg    TEXT,                            -- populated on failure
  created_at   TIMESTAMPTZ  DEFAULT now()
);
```

#### `thumbs` — Thumb Reactions

```sql
CREATE TABLE thumbs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID  NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id      UUID  NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT thumbs_unique_per_user UNIQUE (question_id, user_id)
);
```

> **Note:** The `UNIQUE(question_id, user_id)` constraint enforces the 1-reaction-per-user rule at the database level.

### 2.3 Indexes

```sql
CREATE INDEX idx_questions_session_id   ON questions(session_id);
CREATE INDEX idx_questions_created_at   ON questions(created_at DESC);
CREATE INDEX idx_questions_thumb_count  ON questions(thumb_count DESC);
CREATE INDEX idx_answers_question_id    ON answers(question_id);
CREATE INDEX idx_ai_drafts_question_id  ON ai_drafts(question_id);
CREATE INDEX idx_thumbs_question_id     ON thumbs(question_id);
CREATE INDEX idx_users_session_id       ON users(session_id);
CREATE INDEX idx_users_auth_id          ON users(auth_id);
```

### 2.4 Trigger — Auto-update `thumb_count`

```sql
CREATE OR REPLACE FUNCTION update_thumb_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions SET thumb_count = thumb_count + 1 WHERE id = NEW.question_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_thumb_count
AFTER INSERT ON thumbs
FOR EACH ROW EXECUTE FUNCTION update_thumb_count();
```

---

## 3. API Design

### 3.1 REST Endpoints

All endpoints are Next.js API Routes under `/api`.

#### Session

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/sessions` | None | Create a new session |
| `GET` | `/api/sessions/:code` | None | Fetch session info by invite code |
| `POST` | `/api/sessions/:id/join` | None | Join session (register nickname, get JWT) |
| `GET` | `/api/sessions/:id/participants` | admin | List current participants |
| `POST` | `/api/sessions/:id/admins` | super_admin | Assign additional admin |
| `DELETE` | `/api/sessions/:id/admins/:userId` | super_admin | Revoke admin role |

#### Questions

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/sessions/:id/questions` | participant | List questions (paginated, sorted) |
| `POST` | `/api/questions` | participant | Submit a question |
| `PATCH` | `/api/questions/:id` | author or admin | Edit question |
| `DELETE` | `/api/questions/:id` | author or admin | Delete question |
| `PATCH` | `/api/questions/:id/pin` | admin | Toggle pin status |

#### Reactions

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/questions/:id/thumbs` | participant | Add thumb reaction (1 per user) |

#### Answers

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/questions/:id/answers` | admin | Post an answer |
| `PATCH` | `/api/answers/:id` | admin | Edit an answer |
| `DELETE` | `/api/answers/:id` | admin | Delete an answer |

#### AI Drafts

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/questions/:id/ai-draft` | admin | Fetch AI draft for a question |
| `POST` | `/api/questions/:id/ai-draft/retry` | admin | Retry failed draft generation |
| `POST` | `/api/questions/:id/ai-draft/publish` | admin | Publish draft as official answer |

### 3.2 Request / Response Examples

#### `POST /api/sessions` — Create Session

```json
// Request
{
  "title": "AI Trends 2026 — Q&A",
  "description": "Post-keynote audience Q&A",
  "nickname": "Jane (Host)",
  "aiProvider": "claude",
  "aiApiKey": "sk-ant-..."
}

// Response 201
{
  "sessionId": "uuid-...",
  "code": "AB12CD",
  "qrUrl": "https://askly.app/join/AB12CD",
  "token": "eyJ..."   // Super Admin JWT
}
```

#### `POST /api/questions/:id/ai-draft/publish` — Publish AI Draft

```json
// Request
{
  "draftId": "uuid-...",
  "content": "Great question! The key difference is...",  // optionally edited
  "showAiBadge": false
}

// Response 201
{
  "answerId": "uuid-...",
  "source": "ai_assisted",
  "content": "Great question! The key difference is...",
  "createdAt": "2026-03-26T10:00:00Z"
}
```

### 3.3 Realtime Channels (Supabase)

| Channel | Events | Subscribers |
|---|---|---|
| `session:{id}:questions` | `INSERT`, `UPDATE`, `DELETE` | All participants |
| `session:{id}:answers` | `INSERT`, `UPDATE`, `DELETE` | All participants |
| `session:{id}:thumbs` | `INSERT` | All participants |
| `session:{id}:ai_drafts` | `INSERT`, `UPDATE` | Admins only |
| `session:{id}:presence` | join / leave | Admins only |

---

## 4. Security & Access Control

### 4.1 Row Level Security (RLS) Policies

#### `questions` table

```sql
-- SELECT: public questions visible to all; private only to author + admins
CREATE POLICY "questions_select" ON questions FOR SELECT
  USING (
    is_private = FALSE
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND session_id = questions.session_id
        AND role IN ('admin', 'super_admin')
    )
  );

-- INSERT: any authenticated participant of the session
CREATE POLICY "questions_insert" ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND session_id = NEW.session_id
    )
  );

-- UPDATE/DELETE: author or admin
CREATE POLICY "questions_modify" ON questions FOR ALL
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND session_id = questions.session_id
        AND role IN ('admin', 'super_admin')
    )
  );
```

#### `ai_drafts` table

```sql
-- SELECT: admins only
CREATE POLICY "ai_drafts_select" ON ai_drafts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN questions q ON q.id = ai_drafts.question_id
      WHERE u.auth_id = auth.uid()
        AND u.session_id = q.session_id
        AND u.role IN ('admin', 'super_admin')
    )
  );

-- INSERT/UPDATE: service role only (via API Routes)
-- No client-side policy — service_role key bypasses RLS
```

#### `thumbs` table

```sql
-- INSERT: any participant, enforced by UNIQUE constraint
CREATE POLICY "thumbs_insert" ON thumbs FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

### 4.2 AI API Key Security

```
Admin inputs API key in browser
  ↓  HTTPS POST to /api/sessions
  ↓  Server-side: AES-256-GCM encrypt with ENCRYPT_SECRET env var
  ↓  Store encrypted blob in sessions.ai_api_key_enc
  ↓  (Key is never returned to client after this point)

On AI draft generation:
  ↓  API Route fetches encrypted key from DB
  ↓  Server-side decryption with ENCRYPT_SECRET
  ↓  Call AI API  →  Store result in ai_drafts
  ↓  (Decrypted key exists only in server memory, never logged)
```

### 4.3 JWT Authentication Flow

```
User joins session
  → Supabase anonymous sign-in  →  auth UID issued
  → POST /api/sessions/:id/join  →  user record created
  → Custom JWT minted with claims:
      { sub: authUid, sessionId, userId, role, exp }
  → All subsequent API requests: Authorization: Bearer <token>
  → API Routes validate JWT + role claim before processing
```

### 4.4 Environment Variables

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypass RLS for admin ops |
| `ENCRYPT_SECRET` | Server only | 32-byte key for AES-256-GCM |
| `JWT_SECRET` | Server only | Custom JWT signing key |

---

## 5. Frontend Architecture

### 5.1 Page Routing (Next.js App Router)

```
app/
├── page.tsx                        # Home — create session / enter code
├── join/
│   └── [code]/
│       └── page.tsx                # Nickname entry → join
├── session/
│   └── [id]/
│       └── page.tsx                # Participant Q&A feed
├── admin/
│   └── [id]/
│       ├── page.tsx                # Admin dashboard
│       └── qr/
│           └── page.tsx            # Full-screen QR display
└── api/
    ├── sessions/route.ts
    ├── sessions/[id]/...
    ├── questions/route.ts
    ├── questions/[id]/...
    └── ...
```

### 5.2 Core Components

| Component | Responsibility |
|---|---|
| `<QRCodeDisplay>` | Render QR via qrcode.react; PNG/SVG download |
| `<QuestionFeed>` | Real-time question list; sort by latest / popular |
| `<QuestionCard>` | Individual question; thumb button; answer display |
| `<ThumbButton>` | 1-per-user reaction; optimistic count update |
| `<AdminPanel>` | AI draft viewer; publish button; answer editor |
| `<AIDraftCard>` | Draft content; editable textarea; [Publish] button |
| `<AnswerComposer>` | Manual answer write/edit interface for admins |
| `<RealtimeProvider>` | Supabase Realtime subscription context |
| `<SessionCodeBadge>` | Displays 6-char code; click to copy |
| `<ParticipantCount>` | Live participant count (admin view) |

### 5.3 State Management

```
┌─────────────────────────────────────────────┐
│              Zustand Store                  │
│  sessionStore   – session info, user role   │
│  questionStore  – questions list, sort      │
│  uiStore        – modals, loading states    │
└───────────────────┬─────────────────────────┘
                    │ sync
         ┌──────────┴──────────┐
         │  TanStack Query      │  ← REST API fetching, caching
         │  (server state)      │
         └──────────┬──────────┘
                    │ real-time updates
         ┌──────────┴──────────┐
         │  Supabase Realtime  │  ← WebSocket subscription
         └─────────────────────┘
```

### 5.4 Optimistic Updates

- **Thumb reaction**: count +1 immediately on click; rollback on server error
- **Question submit**: added to local list instantly; synced with server-assigned ID on response
- **Answer post**: shown immediately in admin view; propagated to participants via Realtime

---

## 6. AI Integration

### 6.1 Draft Generation Flow

```
1. Question inserted into DB (Supabase)
2. Supabase Realtime triggers server webhook (or: client triggers API call)
3. POST /api/questions/:id/ai-draft
   a. Create ai_drafts record (status: 'generating')
   b. Fetch + decrypt admin's API key from sessions table
   c. Call Claude API (or OpenAI API)
   d. Stream or await response
   e. Update ai_drafts (status: 'done', content: <response>)
4. Supabase Realtime propagates UPDATE to admin's channel
5. Admin panel displays AI Draft badge
```

### 6.2 Claude API Call

```typescript
// POST https://api.anthropic.com/v1/messages
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",   // fast & cheap for drafts
  max_tokens: 512,
  system: `You are an assistant helping a presenter respond to audience questions.
Write a clear, friendly answer in 2–4 sentences.
Use a direct, conversational tone as if the presenter is speaking.
Match the language of the question (Korean or English).`,
  messages: [
    {
      role: "user",
      content: `[Session: ${sessionTitle}]\n[Question]: ${questionContent}\n\nPlease write an answer draft.`
    }
  ]
});
```

### 6.3 Error Handling

| Error | Handling |
|---|---|
| API key not set | Show prompt to enter API key in admin settings |
| 5xx server error | Retry up to 2 times with exponential backoff; mark `failed` after |
| 429 Rate Limit | Queue requests; process sequentially with delay |
| 30s timeout | Mark as `failed`; show manual retry button in admin panel |
| Invalid key (401) | Immediately mark `failed`; prompt admin to update API key |

### 6.4 Token Cost Estimate (Claude Haiku)

| Metric | Estimate |
|---|---|
| Avg. prompt tokens | ~150 tokens |
| Avg. completion tokens | ~100 tokens |
| Cost per question | ~$0.00004 (Haiku pricing) |
| 100 questions/session | ~$0.004 per session |

---

## 7. Real-Time Communication

### 7.1 Supabase Realtime Subscription (Client)

```typescript
// Participant — subscribe to question feed
const questionChannel = supabase
  .channel(`session:${sessionId}:questions`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'questions',
    filter: `session_id=eq.${sessionId}`,
  }, (payload) => {
    handleQuestionChange(payload);
  })
  .subscribe();

// Admin — additionally subscribe to AI drafts
const draftChannel = supabase
  .channel(`admin:${sessionId}:drafts`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'ai_drafts',
  }, (payload) => {
    handleDraftChange(payload);
  })
  .subscribe();
```

### 7.2 Presence (Admin View — Active Participant Count)

```typescript
const presenceChannel = supabase
  .channel(`session:${sessionId}:presence`)
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    setParticipantCount(Object.keys(state).length);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({ userId, nickname });
    }
  });
```

### 7.3 Fallback Strategy

- If Supabase Realtime connections exceed 200 (free tier limit): fall back to **polling every 3 seconds** via TanStack Query's `refetchInterval`
- Monitor connection count via Supabase dashboard; upgrade tier if sessions regularly hit limit

---

## 8. Deployment Strategy

### 8.1 Environments

| Environment | URL | Purpose |
|---|---|---|
| Development | `localhost:3000` | Local dev with Supabase local emulator |
| Staging | `askly-staging.vercel.app` | QA testing, PR previews |
| Production | `askly.vercel.app` (custom domain optional) | Live service |

### 8.2 CI/CD Pipeline

```
Push to feature branch
  → Vercel preview deployment (auto)
  → Run unit tests (GitHub Actions)
  → PR review

Merge to main
  → Vercel production deployment (auto)
  → Run E2E tests (Playwright)
  → Notify team on success/failure
```

### 8.3 Local Development Setup

```bash
# 1. Clone & install
git clone https://github.com/your-org/askly.git
cd askly
npm install

# 2. Start Supabase local
npx supabase start

# 3. Apply migrations
npx supabase db reset

# 4. Set environment variables
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, ENCRYPT_SECRET, JWT_SECRET

# 5. Run dev server
npm run dev
```

### 8.4 Database Migrations

```
supabase/
└── migrations/
    ├── 0001_create_sessions.sql
    ├── 0002_create_users.sql
    ├── 0003_create_questions.sql
    ├── 0004_create_answers.sql
    ├── 0005_create_ai_drafts.sql
    ├── 0006_create_thumbs.sql
    ├── 0007_create_indexes.sql
    ├── 0008_enable_rls.sql
    └── 0009_create_triggers.sql
```

---

## 9. Development Schedule (Phase 1)

| Week | Scope | Tasks |
|---|---|---|
| **Week 1** | Foundation | Project setup, Supabase schema + migrations, anonymous auth flow, env config |
| **Week 2** | Core Features | Session creation, QR code generation, join flow, question CRUD |
| **Week 3** | Real-Time + Reactions | Supabase Realtime integration, thumb reactions (1-per-user), admin answer posting |
| **Week 4** | AI Integration | Claude API integration, draft generation, admin-only panel, publish flow |
| **Week 5** | UI/UX Polish | Responsive design, mobile optimization, animations, accessibility (WCAG 2.1) |
| **Week 6** | Testing + Deploy | E2E tests (Playwright), performance optimization, production deployment |

---

## 10. Technical Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Supabase Realtime 200-connection limit per session | High | Monitor per-session connections; implement 3s polling fallback if exceeded |
| AI API rate limiting | Medium | Request queue with sequential processing; retry with backoff |
| Vercel serverless cold start latency | Low | Apply Edge Runtime to latency-sensitive routes |
| AI API key compromise | High | AES-256-GCM encryption at rest; server-only decryption; never expose to client |
| Supabase Free DB 500 MB cap | Low | Implement scheduled cleanup job to purge expired sessions + related data |
| Anonymous session hijacking | Medium | JWT expiry (24h); bind token to session_id + user_id claims |

---

## Appendix: Project File Structure

```
askly/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home
│   ├── join/[code]/page.tsx
│   ├── session/[id]/page.tsx
│   ├── admin/[id]/page.tsx
│   └── api/                      # API Routes
├── components/
│   ├── ui/                       # Reusable base components
│   ├── session/                  # Session-specific components
│   ├── question/                 # Question/Answer components
│   └── admin/                    # Admin-only components
├── lib/
│   ├── supabase/                 # Supabase client + helpers
│   ├── ai/                       # AI API wrappers
│   ├── crypto/                   # AES encryption utils
│   └── realtime/                 # Realtime subscription hooks
├── store/
│   ├── sessionStore.ts
│   ├── questionStore.ts
│   └── uiStore.ts
├── supabase/
│   ├── migrations/               # SQL migration files
│   └── config.toml
├── tests/
│   ├── unit/
│   └── e2e/                      # Playwright tests
├── .env.example
├── PRD.md
└── TRD.md
```
