# Hourline

Personal timesheet app with job-title templates, PDF export, and employer email delivery. Built on the same stack as Waypoint with the Transit design system.

## Features

- User login (register / sign in)
- Job-title presets: Field Engineer, Office/Desk, Consultant, Freelancer
- Personal templates — fork a preset and toggle visible/required fields
- Weekly timesheet grid with add, edit, delete
- Mark week as ready → preview PDF (watermarked with **Generated with Hourline**)
- Send PDF to employer email configured in Settings
- Dark mode via `@zainalhassan/design-system`

## Quick start (Docker)

```bash
cp .env.example .env
# Set AUTH_SECRET (32+ chars): openssl rand -base64 32

docker compose up --build
```

Open http://localhost:3001

Demo user (after seed): `demo@hourline.app` / `password`

```bash
docker compose exec app npm run db:seed
```

## Local dev (without Docker app container)

```bash
npm install
cp .env.example .env
# DATABASE_URL=postgresql://hourline:hourline@localhost:5434/hourline
docker compose up db -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Email

Configure SMTP in `.env` to enable **Send to employer**:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=hourline@yourdomain.com
SMTP_USER=...
SMTP_PASS=...
```

Without SMTP, you can still preview and download PDFs.

## Stack

- Next.js 16, React 19, TypeScript
- PostgreSQL + Prisma 7
- Auth.js credentials
- @react-pdf/renderer for PDFs
- Nodemailer for email
