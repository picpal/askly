# PRD — Askly: Real-Time Q&A Platform

> **Version:** 1.0 | **Date:** 2026-03-26 | **Status:** Draft (Pending Review)
> **Classification:** Internal

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Stakeholders & User Types](#2-stakeholders--user-types)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Feature Priority & Release Plan](#5-feature-priority--release-plan)
6. [Key User Flows](#6-key-user-flows)
7. [Constraints & Assumptions](#7-constraints--assumptions)
8. [Success Metrics (KPI)](#8-success-metrics-kpi)
9. [Open Issues](#9-open-issues)

---

## 1. Product Overview

### 1.1 Background & Purpose

Askly is a self-hosted, fully free alternative to Slido — a real-time Q&A platform for seminars, lectures, and conferences. Audiences join via QR code, submit questions, react with thumbs up, and receive answers from moderators. Admins are assisted by AI-generated answer drafts that they can review and publish, creating a smart and efficient moderation workflow — all without any platform cost.

### 1.2 Product Vision

> *"Break the wall between presenters and audiences by providing a smart communication space backed by AI."*

### 1.3 Scope

- Web-based SPA (Single Page Application), mobile-responsive
- Operable entirely within free-tier cloud infrastructure
- Full flow: QR invite → real-time Q&A → AI draft → admin publish
- No native mobile app (PWA consideration in Phase 2)
- No user registration — nickname-based anonymous participation

---

## 2. Stakeholders & User Types

| Role | How They Join | Permissions |
|---|---|---|
| **Super Admin** | Creates the session | All admin permissions + ability to assign additional admins |
| **Admin** | Designated by Super Admin | Post answers, view & publish AI drafts |
| **Participant** | Joins via QR code or session code | Submit questions, react with thumbs up |

### Permission Matrix

| Action | Participant | Admin | Super Admin |
|---|:---:|:---:|:---:|
| Submit question | ✅ | ✅ | ✅ |
| Thumb reaction | ✅ | ✅ | ✅ |
| View admin answers | ✅ | ✅ | ✅ |
| Post/edit answers | ❌ | ✅ | ✅ |
| View AI drafts | ❌ | ✅ | ✅ |
| Publish AI drafts | ❌ | ✅ | ✅ |
| Assign admins | ❌ | ❌ | ✅ |
| Close/delete session | ❌ | ❌ | ✅ |

---

## 3. Functional Requirements

### 3.1 Session Management

#### FR-01 — Session Creation
- Any user can create a session by entering a nickname (no account required)
- Upon creation: unique 6-character alphanumeric session code and QR code are auto-generated
- Session settings: title, description, expiration time (optional), AI provider & API key
- Creator is automatically designated as **Super Admin**

#### FR-02 — QR Code Invitation
- QR code is displayed on screen and downloadable as PNG/SVG
- Scanning the QR code redirects to nickname entry page, then session feed
- Direct entry via session code is also supported

#### FR-03 — Admin Assignment
- Super Admin can designate any current participant as Admin
- Admins cannot delegate their role — only Super Admin can assign
- Admin list is visible only to admins

### 3.2 Q&A Feed

#### FR-04 — Question Submission
- All participants (including admins) can submit questions
- Max length: 500 characters
- Displays: author nickname, timestamp
- Optional: mark question as private (visible only to author + admins)

#### FR-05 — Thumb Reaction (👍)
- All participants and admins can react with a thumbs up to any question
- **1 reaction per user per question** — enforced client-side (session storage) and server-side (DB unique constraint)
- Cumulative count is displayed in real time
- Reacted questions show an active/filled icon state; reactions are **not reversible**

#### FR-06 — Answer System
- Admins can write, edit, and delete answers per question
- Admin answers are **visible to all participants**
- AI-generated drafts are **visible to admins only**
- Participants only see official admin-posted answers
- Admins can click **[Publish]** on an AI draft to post it as their official answer
- AI drafts can be edited before publishing

### 3.3 AI Answer Feature

#### FR-07 — AI Draft Generation
- When a new question is submitted, an AI draft is automatically requested
- Draft is displayed only in the admin panel
- Draft status indicator: `generating` → `done` / `failed`
- On failure: retry button is shown
- AI provider: Claude API (Anthropic) or OpenAI API, using the admin's own API key (no platform cost)

#### FR-08 — AI Draft Publishing
- Admin can publish the AI draft as-is or after editing
- Clicking **[Publish]** registers the content as the official admin answer
- An "AI-assisted" label can optionally be shown to participants (admin's choice)

### 3.4 Real-Time Updates

#### FR-09 — Real-Time Sync
- New questions, answers, and thumb reactions are propagated in real time via WebSocket (Supabase Realtime)
- Admin panel shows new AI drafts in real time
- Active participant count is shown to admins in real time

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Initial feed load < 2s; real-time event propagation < 1s |
| **Availability** | 99%+ uptime via serverless auto-scaling architecture |
| **Free Operation** | Fully operable within Supabase Free / Vercel Free / Cloudflare Free tiers |
| **Security** | Session-code-based access control; AI API keys stored server-side only (AES-256 encrypted) |
| **Responsive** | Full support from 360px (mobile) to 1440px (desktop) |
| **Accessibility** | Target WCAG 2.1 AA compliance |
| **Concurrency** | Designed for up to 500 simultaneous participants per session (free-tier limit) |
| **Session Lifetime** | Up to 24 hours per session |

---

## 5. Feature Priority & Release Plan

| ID | Feature | Description | Priority | Phase |
|---|---|---|:---:|:---:|
| F-01 | Session Creation | QR code generation, session setup, Super Admin designation | P0 | 1 |
| F-02 | Question Submission | Text question submission with nickname display | P0 | 1 |
| F-03 | Thumb Reaction | 1-per-user thumbs up with cumulative count | P0 | 1 |
| F-04 | Admin Answer | Write/edit/delete official answers | P0 | 1 |
| F-05 | AI Draft Generation | AI API integration, admin-only draft visibility | P1 | 1 |
| F-06 | AI Draft Publishing | Draft → official answer publish flow | P1 | 1 |
| F-07 | Real-Time Sync | WebSocket/SSE-based live feed updates | P0 | 1 |
| F-08 | Additional Admin Assignment | Super Admin delegates admin role | P1 | 2 |
| F-09 | Private Questions | Author + admin-only visibility option | P2 | 2 |
| F-10 | Sort & Pin | Sort by popularity/recent; pin important questions | P2 | 2 |

---

## 6. Key User Flows

### 6.1 Session Creation (Super Admin)

```
Home screen
  → Click [Create New Session]
  → Enter session title and nickname
  → Session created → QR code + session code displayed
  → Download or share QR code
  → Enter admin dashboard
```

### 6.2 Participant Join

```
Scan QR code  OR  Enter session code manually
  → Enter nickname
  → Join session → Q&A feed displayed
  → Submit question  OR  Thumb-react to existing questions
  → View admin answers in real time
```

### 6.3 AI Draft → Publish (Admin)

```
New question submitted
  → AI draft auto-generated in background
  → [AI Draft] badge appears in admin panel
  → Admin reviews draft → optionally edits content
  → Admin clicks [Publish]
  → Content registered as official admin answer
  → Visible to all participants as admin answer
```

### 6.4 Manual Admin Answer

```
Admin clicks [Answer] on a question
  → Opens text editor
  → Writes answer → clicks [Submit]
  → Answer visible to all participants immediately
```

---

## 7. Constraints & Assumptions

### 7.1 Constraints

- **Free infrastructure only**: Must operate within Supabase / Vercel / Cloudflare free tier limits
- **AI API cost**: Admin supplies their own API key (Claude or OpenAI) — zero platform cost
- **No native mobile app**: Web-only (PWA optional in Phase 2)
- **No authentication system**: Nickname-based anonymous participation only

### 7.2 Assumptions

- Max concurrent users per session: **500** (free tier design ceiling)
- Session duration: up to **24 hours**
- Primary language for AI responses: **Korean** (multilingual support in Phase 2)
- Thumb reactions are **not reversible** (no unlike functionality)
- Admins are trusted actors; no moderation/flagging system in Phase 1

---

## 8. Success Metrics (KPI)

| Metric | Phase 1 Target | Measurement Method |
|---|:---:|---|
| Session creation completion rate | ≥ 95% | Initiated vs. completed sessions |
| QR scan → join conversion rate | ≥ 80% | Scans vs. successful joins |
| Avg. thumb reactions per question | ≥ 3 | Per-session aggregation |
| AI draft → publish conversion rate | ≥ 50% | Drafts generated vs. published |
| Real-time event propagation latency | < 1s | Server-side timestamp delta |

---

## 9. Open Issues

| # | Issue | Owner | Status |
|---|---|---|---|
| OI-01 | Final AI provider decision (Claude vs OpenAI vs free model) | Product | Open |
| OI-02 | Data retention policy after session expiration | Product | Open |
| OI-03 | Whether thumb reactions should be reversible | UX | Open |
| OI-04 | Default value for private question toggle | UX | Open |
| OI-05 | Whether to show "AI-assisted" badge to participants by default | Product | Open |
