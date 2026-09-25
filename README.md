# GENESIS 4.0 Quiz

Production-ready event quiz web application for **GENESIS 4.0**, organized by **GDG IIIT Kota**.

Participants authenticate with Google (`@iiitkota.ac.in` only). Admins manage questions, settings, and results through a separate secured dashboard. All questions, answers, marking, and duration live in PostgreSQL — nothing is hardcoded in the frontend.

## Architecture

```
genesis-quiz/
├── frontend/          React + Vite + React Router (Bauhaus UI)
├── backend/           Node.js + Express API
├── .env.example
└── README.md
```

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, React Router, CSS |
| Backend | Node.js, Express, Passport (Google OAuth), express-session |
| Database | PostgreSQL |
| Auth | Google OAuth 2.0 (participants), username/password + bcrypt (admin) |

## Features

- Bauhaus visual identity with GDG branding
- Google login restricted to exact domain `iiitkota.ac.in`
- Quiz engine: single-choice, multiple-choice, true/false
- Server-authoritative timer, scoring, and answer keys
- Admin CRUD for questions (draft/publish, reorder, duplicate, preview)
- Quiz settings (duration, negative marking, randomization, result visibility)
- Results dashboard with search/sort
- HttpOnly sessions, rate limiting, Helmet, CORS

## Local setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Google Cloud OAuth credentials (for participant login)

### 1. Database

Using Docker:

```bash
docker run -d --name genesis-pg \
  -e POSTGRES_USER=genesis \
  -e POSTGRES_PASSWORD=genesis \
  -e POSTGRES_DB=genesis_quiz \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://genesis:genesis@localhost:5432/genesis_quiz
SESSION_SECRET=replace-with-long-random-string
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-strong-password
ALLOWED_EMAIL_DOMAIN=iiitkota.ac.in
```

### 3. Backend

```bash
cd backend
npm install
npm run db:setup    # migrate + seed demo data + admin user
npm run dev
```

API: `http://localhost:3001`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`  
Vite proxies `/api` to the backend.

## Google OAuth configuration

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins**
   - Development: `http://localhost:5173`
   - Production: your frontend HTTPS origin
4. **Authorized redirect URIs**
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://<api-host>/api/auth/google/callback`
5. Copy Client ID and Client Secret into `backend/.env`.
6. Never commit real OAuth secrets.

### Allowed email domain

Only Google accounts whose verified email domain is **exactly** `iiitkota.ac.in` may participate.

- Allowed: `student@iiitkota.ac.in`
- Rejected: `user@gmail.com`, `attackeriiitkota.ac.in`, spoofed suffixes

Validation runs on the server (`emailDomain === "iiitkota.ac.in"`), not via `endsWith`. Unverified Google emails are rejected. Being `@iiitkota.ac.in` does **not** grant admin access.

## Admin setup

Seed creates an admin from `ADMIN_USERNAME` / `ADMIN_PASSWORD` (password hashed with bcrypt).

- Login: `http://localhost:5173/admin/login`
- Default (from `.env`): username `admin` — change the password before production.

Admin role is stored as `role = 'admin'` in the database. Participants never become admins based on email domain alone.

## Development commands

| Command | Where | Purpose |
|---------|-------|---------|
| `npm run dev` | backend | Start API with nodemon |
| `npm run db:migrate` | backend | Run schema migrations |
| `npm run db:seed` | backend | Seed settings, admin, DEMO questions |
| `npm run db:setup` | backend | Migrate + seed |
| `npm run start` | backend | Production API start |
| `npm run dev` | frontend | Vite dev server |
| `npm run build` | frontend | Production build |
| `npm run preview` | frontend | Preview production build |

## Demo data

Seed inserts **5 DEMO questions** marked with `[DEMO]` in the text. Delete or replace them from the admin panel before the real event.

## API overview

### Auth
- `GET /api/auth/google` — start Google OAuth
- `GET /api/auth/google/callback` — OAuth callback
- `GET /api/auth/me` — current session
- `POST /api/auth/logout`
- `POST /api/auth/admin/login`

### Quiz (participant)
- `GET /api/quiz/config` — public config (no answers)
- `POST /api/quiz/start`
- `GET /api/quiz/attempt/:attemptId`
- `PUT /api/quiz/attempt/:attemptId/answers` — save progress
- `POST /api/quiz/attempt/:attemptId/submit`
- `GET /api/quiz/result`

### Admin (requires admin session)
- `GET /api/dashboard`
- `GET|POST /api/questions`, `GET|PUT|DELETE /api/questions/:id`
- `POST /api/questions/:id/duplicate`
- `PATCH /api/questions/:id/status`
- `PATCH /api/questions/reorder`
- `GET|PUT /api/settings`
- `GET /api/results`, `GET /api/results/:id`

Participant APIs never return `correctAnswers`. Scoring runs only on the server.

## Production build

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Deploy frontend/dist to Vercel / Cloudflare Pages / etc.
```

### Deployment notes

- Use HTTPS in production.
- Set `NODE_ENV=production`, strong `SESSION_SECRET`, and production `DATABASE_URL`.
- Update `FRONTEND_URL`, `GOOGLE_CALLBACK_URL`, and Google Console redirect URIs.
- Session cookies use `Secure` + `SameSite=none` when `NODE_ENV=production` (needed for cross-origin frontend/API).
- Host frontend and backend with CORS `FRONTEND_URL` matching the real origin.

## Security highlights

- HttpOnly session cookies (no tokens in `localStorage`)
- Server-side Google profile + `email_verified` + exact domain check
- Admin passwords hashed with bcrypt (cost 12)
- Rate-limited auth and submission endpoints
- Helmet security headers
- Soft-delete for questions (preserves historical attempt integrity)
- Client scores, timers, roles, and domains are never trusted

## Routes

| Path | Audience |
|------|----------|
| `/` | Landing |
| `/instructions` | Rules |
| `/quiz` | Active quiz (auth) |
| `/result` | Score (auth) |
| `/profile` | Profile (auth) |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Stats |
| `/admin/questions` | Question list |
| `/admin/questions/new` | Create |
| `/admin/questions/:id/edit` | Edit |
| `/admin/settings` | Quiz settings |
| `/admin/results` | Attempts |

## License

Built for GDG IIIT Kota — GENESIS 4.0.
