# Initial Security Review

This is a static, first-pass review of the uploaded archive, focused on public-release hygiene. It is not a full penetration test and does not establish that the application is secure.

## Findings

### High — third-party credentials embedded in source
**Original locations:** `api/databases/ptc.py`, `api/sms_019/ptc.py`

The original archive contained embedded values for Google OAuth, Google Ads, SMS-provider access, and Twilio-related configuration. The sanitized copy replaces these with environment-variable lookups and includes variable names in `.env.example`.

**Required action:** Revoke/rotate any real credentials from the original archive. Removing a value from the latest copy does not invalidate it and does not remove it from any Git history or backups.

### High — hard-coded administrator bootstrap credentials
**Original locations:** `api/databases/manager.py`, `cleaneril.py`

The original startup path created a root/admin account using fixed credentials. The sanitized copy removes the bootstrap helper and its startup invocation.

**Required action:** If this bootstrap was ever used in a live environment, change the affected account credentials and review access logs.

### High — password storage/authentication updated; migration still requires validation
**Locations:** `api/databases/manager.py`, `api/databases/employee.py`, `migrations/versions/9f31a2c4d7e8_password_hash_columns.py`

Manager and employee passwords are now written using Werkzeug password hashing. Manager login preserves the existing `manager_auth(phone, password)` function name/signature and transparently upgrades legacy plaintext credentials after successful verification. Employee authentication does the same for legacy records. Password columns are widened to support hashes.

**Required action:** Back up the database, apply the new migration before running the changed code against an existing database, then test registration, successful/failed login, employee authentication, and account deletion against a disposable copy. No live database migration or end-to-end application test was performed as part of this change.

### High — local database and customer-specific images included in original archive
**Original locations:** `instance/cleaneril.db`, `client/static/images/ba/`, and hashed files under `client/static/images/logo/`

The archive contained a SQLite database and collections of uploaded image/logo assets that may include customer or business data. The sanitized copy excludes these files and retains the default logo asset.

**Required action:** Review any copies already shared or committed. If customer data was exposed, follow applicable privacy and incident-response obligations.

### Medium — session secret and development server defaults
**Original locations:** `api/databases/ptc.py`, `cleaneril.py`

The original session secret was generated from a short random value at startup, and the app launched a debug server bound to all interfaces. The sanitized copy uses `FLASK_SECRET_KEY` when configured, generates a longer temporary fallback for local use, and binds the built-in server to loopback with debug disabled.

**Required action:** Set a stable, high-entropy `FLASK_SECRET_KEY` in every deployed environment. Do not use Flask's built-in server for production.

### Medium — deployment and integration settings
The production domain was embedded in frontend configuration. The sanitized copy uses the current browser origin for the client-side URL constants and environment configuration for the server-side domain/redirect URI.

**Required action:** Confirm the configured OAuth callback URLs match the provider console exactly.

## Sanitization performed

- Removed `.idea`, Python bytecode/cache directories, local database files, and nested `.git` directory entries.
- Removed uploaded/business-specific image collections.
- Moved embedded external-service credential values to environment-variable configuration.
- Removed hard-coded admin bootstrap credentials and startup creation.
- Updated manager and employee password storage to use Werkzeug password hashes, with legacy-password upgrade after successful authentication; added a migration to widen password columns.
- Replaced a personal email address with `support@example.com`.
- Added `README.md`, `.gitignore`, `.env.example`, `requirements.txt`, and `SECURITY.md`.

## Validation performed

- Python source files passed a syntax compilation check before the password changes; a second compilation check was run after the password changes.
- A text scan of the sanitized working tree found no remaining matches for the known credential values or common high-confidence token patterns checked during this pass.
- The application was not started, migrations were not run, and external integrations were not exercised.
- This scan does not guarantee that every secret or personal detail has been found. Review the final repository and run a dedicated secret scanner before publishing.
