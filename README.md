# CleanerIL — Business Management Platform

CleanerIL is a web-based management platform for a cleaning-services business. The codebase includes customer and order management, workers, invoices, payments, subscriptions, job sharing/marketplace features, and integrations with external providers.

> **Portfolio / security notice:** This repository is a sanitized snapshot prepared for code review and portfolio presentation. It has not been fully security-audited or validated for production deployment. External integrations require your own credentials. Do not use real customer data in a public repository.

## Technology

- **Backend:** Python, Flask, Flask-SQLAlchemy, Flask-Migrate
- **UI in this archive:** Flask templates/Jinja, HTML, CSS, and browser-side JavaScript
- **Database:** SQLite by default; configurable with `DATABASE_URL`
- **Integrations:** Google OAuth / Google Ads, Google Calendar, SMS provider, Cardcom, and OpenFormat export functionality

**Scope note:** This uploaded archive contains a Flask template-based frontend and vanilla JavaScript. It does not appear to include a React or Next.js application. If a separate React/Next.js frontend exists, it was not included in this archive.

## Main areas

- `api/routes/` — page and API routes
- `api/databases/` — SQLAlchemy models and database operations
- `api/integrations/` — external integration flows
- `api/sms_019/` — SMS provider integration
- `api/openformat/` — OpenFormat export and validation
- `api/marketplace/` — marketplace and job-sharing functionality
- `client/pages/` — templates and page assets
- `client/static/` — CSS, JavaScript, and static assets
- `migrations/` — Alembic migration scripts

## Configuration

1. Use Python 3.11 or a compatible version.
2. Create and activate a virtual environment.
3. Install dependencies:

   ```bash
   python -m venv .venv
   # Windows:
   .venv\\Scripts\\activate
   # macOS/Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and configure values for your own environment. Never commit `.env`.
5. Set a strong, stable `FLASK_SECRET_KEY` and configure only the integrations you intend to use.
6. Initialize the database/migrations according to your deployment setup.
7. Start locally:

   ```bash
   python cleaneril.py
   ```

The development server is for local testing only. Use a production WSGI server and appropriate deployment configuration for a real deployment.

## Environment variables

See `.env.example`. All third-party credentials should be supplied through environment variables or a secrets manager, not source code. OAuth redirect URIs must exactly match the URLs configured with the relevant provider.

## Security and privacy changes in this snapshot

- Removed the local SQLite database and IDE/cache artifacts.
- Removed uploaded/logo image collections that may contain customer-specific assets.
- Replaced embedded Google/SMS/Twilio credential values with environment-variable lookups.
- Removed the hard-coded administrator bootstrap account.
- Replaced a personal contact address with a non-functional example address.

These changes only sanitize the submitted working tree. They **do not erase secrets from any previous Git history** or revoke credentials. If a credential in the original archive is real, rotate/revoke it with the provider before publishing.

## Known review items — do not treat as production-ready

- Manager and employee password handling now uses Werkzeug password hashes. Existing legacy plaintext credentials are upgraded after successful authentication. Apply the included migration (`9f31a2c4d7e8`) before running the updated code against an existing database; verify the migration against a backup first.
- The password migration and compatibility path have not been validated against a production database or full end-to-end login flow. Treat this as a code change requiring review and testing, not as a production security certification.
- OAuth state handling and callback behavior need further testing; do not assume the integration flows are production-secure based on this cleanup.
- Review authorization checks on all sensitive routes, CSRF protections, input validation, rate limits, upload handling, error responses, and logging before any public release or production use.
- The full application has not been run end-to-end as part of this sanitization. Third-party integrations and external system dependencies have not been tested.

## License

No license was supplied with the archive. Add an appropriate license before granting others permission to reuse this code.
