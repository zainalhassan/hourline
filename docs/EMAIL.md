# Email setup (employer timesheets)

Hourline sends timesheet PDFs via **SMTP** configured on the **server**, not in user settings.

## User settings (in the app)

Under **Settings → Submission**:

- Employer email (required to send)
- Employer name (optional)
- CC self on submit
- Default cover message

## Server environment variables

Set these in your production `.env` (or `docker-compose.prod.yml` `env_file`):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=hourline@yourdomain.com
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

| Variable | Required | Notes |
|----------|----------|-------|
| `SMTP_HOST` | Yes | Mail server hostname |
| `SMTP_FROM` | Yes | From address (must be authorised by provider) |
| `SMTP_PORT` | No | Default `587` (STARTTLS); use `465` for SSL |
| `SMTP_USER` / `SMTP_PASS` | Depends on provider | Required for authenticated SMTP |

After changing env vars, restart the app container:

```bash
docker compose -f docker-compose.prod.yml up -d --build app
```

## Verify delivery

1. Open **Settings** — check the email status banner (configured / not configured).
2. Log at least one entry for the week.
3. **Mark as ready** → **Send to employer** (or **Resend** if already sent).
4. If it fails, check app logs: `docker compose logs app --tail 50`

Without SMTP, **Preview PDF** still works; send shows an error asking you to configure mail or download the PDF.

## Provider examples

- **Postmark / SendGrid / Amazon SES** — use their SMTP credentials
- **Mailbox on your domain** — use your host’s SMTP settings
- Self-hosted Postfix — only if you already manage deliverability (SPF/DKIM)

## Flow

1. User marks period `READY` (validated for required fields).
2. User clicks Send → server generates PDF → Nodemailer attaches it → SMTP delivers to employer.
3. A `Submission` row is stored with timestamp and recipient; period becomes `SENT`.
4. **Resend** creates another submission log entry without reopening the period.
