# Deployment

Hourline deploys as a **self-contained Docker stack**.

## VPS deployment (recommended)

### Requirements

- Linux VPS (Ubuntu 22.04+)
- Docker + Docker Compose v2
- Domain pointing to server IP

### Steps

```bash
git clone <your-repo> hourline
cd hourline
cp .env.example .env
```

Edit `.env`:

```env
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://hourline.bagghu.com
DATABASE_URL=postgresql://hourline:<password>@db:5432/hourline
APP_DISPLAY_NAME=Hourline
POSTGRES_PASSWORD=<strong-password>
```

Start production stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically via the `migrate` service before the app starts.

### HTTPS with Caddy

Copy the project Caddyfile to the server:

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

The included `deploy/Caddyfile` serves **only** `hourline.bagghu.com`. All other hostnames redirect there:

- `hourline.bagghu.co.uk` → `.com`
- `www.hourline.bagghu.com` → `.com`
- `www.hourline.bagghu.co.uk` → `.com`

Set the same URL in `.env`:

```env
AUTH_URL=https://hourline.bagghu.com
```

#### DNS records

| Name | Type | Value | Purpose |
|------|------|--------|---------|
| `hourline.bagghu.com` | A | VPS IP | Live site |
| `hourline.bagghu.co.uk` | A | VPS IP | Redirect to `.com` |
| `www.hourline.bagghu.com` | CNAME | `hourline.bagghu.com` | Optional redirect |
| `www.hourline.bagghu.co.uk` | A or CNAME | VPS / `.co.uk` apex | Optional redirect |

After DNS propagates, reload Caddy. It will issue HTTPS certificates for every hostname listed in the Caddyfile.

Run Caddy on the host or as a separate container on the same Docker network.

## Local development

```bash
docker compose up --build
```

Open http://localhost:3001

## Environment checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | Yes | 32+ random characters |
| `AUTH_URL` | Yes | Full public URL, no trailing slash |
| `DATABASE_URL` | Yes | Use internal `db` hostname in Compose |
| `APP_DISPLAY_NAME` | No | Defaults to `Hourline` |
| `SMTP_*` | No | Required only for email send |

## Backups

Back up the Postgres volume:

```bash
docker compose exec db pg_dump -U hourline hourline > backup.sql
```

## Alternative: Vercel + Neon

Possible but not the primary path. You would:

1. Host Postgres on [Neon](https://neon.tech)
2. Deploy Next.js to [Vercel](https://vercel.com)
3. Set the same env vars in the Vercel project
4. Run `npx prisma migrate deploy` against Neon on deploy

Email (SMTP) and PDF generation work the same; ensure `AUTH_URL` matches the Vercel domain.
