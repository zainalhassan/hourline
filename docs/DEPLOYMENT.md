# Deployment

Waypoint is designed to deploy as a **self-contained Docker stack**.

## VPS deployment (recommended)

### Requirements

- Linux VPS (Ubuntu 22.04+)
- Docker + Docker Compose v2
- Domain pointing to server IP

### Steps

```bash
git clone <your-repo> waypoint
cd waypoint
cp .env.example .env
```

Edit `.env`:

```env
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://waypoint.yourdomain.com
DATABASE_URL=postgresql://waypoint:waypoint@db:5432/waypoint
```

Start production stack:

```bash
docker compose --profile prod up -d --build
```

Migrations run automatically on container start via `docker/entrypoint.sh`.

### HTTPS with Caddy

Example `Caddyfile`:

```
waypoint.yourdomain.com {
  reverse_proxy localhost:3000
}
```

Run Caddy on the host or as a separate container on the same Docker network.

## Environment checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | Yes | 32+ random characters |
| `AUTH_URL` | Yes | Full public URL, no trailing slash |
| `DATABASE_URL` | Yes | Use internal `db` hostname in Compose |

## Backups

Back up the Postgres volume:

```bash
docker compose exec db pg_dump -U waypoint waypoint > backup.sql
```

## Alternative: Vercel + Neon

Possible but not the primary path. You would:

1. Host Postgres on [Neon](https://neon.tech)
2. Deploy Next.js to [Vercel](https://vercel.com)
3. Run `npx prisma migrate deploy` against Neon
4. Set env vars in Vercel dashboard

This splits the stack and loses the single `docker compose` deploy model.

## Health checks

- App: `GET /` should return 200 (redirects to login if unauthenticated)
- DB: `docker compose ps` shows `db` healthy
