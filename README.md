# Verdant LMS

A modern learning management system for colleges — live classes (Zoom),
auto-saved recordings, courses & content, and role-based dashboards for
**students, teachers, and admins**.

Built with **Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui ·
Prisma/PostgreSQL · Auth.js · BullMQ/Redis · MinIO (S3) · Zoom API**.
Design language: **Fresh Mint** (emerald + indigo, Space Grotesk / Inter).

---

## How live classes work

The LMS **integrates Zoom** rather than building video from scratch:

1. A teacher schedules a class → the app creates a **Zoom meeting** via the API.
2. Students join with the **Zoom app they already have** (great on mobile).
3. Zoom **webhooks** report start/end + participant join/leave.
4. When recording is ready, a **background worker** downloads it into **MinIO**,
   removes it from Zoom cloud, and it appears in the course's **Recordings**.
5. **Attendance** is reconciled automatically from the Zoom report.

Only **teachers (hosts)** need a paid Zoom (Pro) license; students join free.

---

## Local development

### Prerequisites
- Node 20+ (tested on 24)
- Docker (for Postgres, Redis, MinIO) — or your own local instances

### 1. Install & configure
```bash
npm install
cp .env.example .env        # then run: npx auth secret  to fill AUTH_SECRET
```

### 2. Start infrastructure
```bash
docker compose up -d        # postgres + redis + minio on localhost
```

### 3. Set up the database
```bash
npm run db:migrate          # create tables (first run names the migration)
npm run db:seed             # demo users, a course, a class
```

### 4. Run the app + worker (two terminals)
```bash
npm run dev                 # http://localhost:3000
npm run worker              # background jobs (recordings, attendance, email)
```

### Demo logins (password: `Password123!`)
| Role    | Email                |
|---------|----------------------|
| Admin   | admin@verdant.edu    |
| Teacher | teacher@verdant.edu  |
| Student | sneha@verdant.edu    |

> Without Zoom credentials the app still works — classes are created as
> placeholders (no join link). Add Zoom env vars to enable the full pipeline.

---

## Zoom setup

1. In the **Zoom App Marketplace**, create a **Server-to-Server OAuth** app.
   Copy the Account ID, Client ID, Client Secret → `.env`.
2. Add scopes for meetings, cloud recording, and reports.
3. Add a **webhook** pointing to `https://<your-domain>/api/zoom/webhook`,
   subscribe to `meeting.started`, `meeting.ended`, `recording.completed`
   (and participant events), and copy the **Secret Token** →
   `ZOOM_WEBHOOK_SECRET_TOKEN`.
4. Each teacher's `zoomUserId` (their licensed Zoom email) is set when an admin
   creates the teacher account.

---

## Production (single VPS)

```bash
# On the server, with Docker installed and .env filled in
# (set AUTH_URL=https://your-domain, S3_PUBLIC_URL=https://your-domain/files):
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec web npm run db:seed   # optional
```

Edit [`nginx/nginx.conf`](nginx/nginx.conf) with your domain and place TLS certs
in `nginx/certs/` (`fullchain.pem`, `privkey.pem`, e.g. via certbot).

The stack runs: **web**, **worker**, **postgres**, **redis**, **minio**, **nginx**.

---

## Project structure

```
src/
  app/
    (app)/            # authenticated area (shared shell)
      student/  teacher/  admin/    # role dashboards + feature pages
    api/
      auth/[...nextauth]/           # Auth.js
      zoom/webhook/                 # Zoom event receiver
    login/  dashboard/  page.tsx    # auth + landing
  components/
    ui/               # shadcn/ui primitives
    app/              # shell, nav, cards, empty states
    forms/            # dialogs + server-action forms
  lib/
    auth.ts auth.config.ts session.ts   # authentication + RBAC
    db.ts redis.ts queue.ts storage.ts  # infrastructure clients
    zoom.ts email.ts                     # integrations
    actions/                             # server actions
  worker/index.ts     # BullMQ consumers
prisma/schema.prisma  # data model
```

## Useful scripts
| Script | Purpose |
|---|---|
| `npm run dev` / `npm run worker` | app / background worker (dev) |
| `npm run db:migrate` / `db:seed` / `db:studio` | database |
| `npm run typecheck` / `npm run build` | verify |
