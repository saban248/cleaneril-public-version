# Security Policy

This repository is a sanitized portfolio snapshot and is not certified or guaranteed to be secure for production use.

## Reporting a vulnerability

Please do not publish sensitive details about a real deployment, customer, or credential in a public issue. Contact the project maintainer privately through a verified contact channel.

## Secrets

- Never commit `.env`, database files, customer uploads, access tokens, or private keys.
- Use environment variables or a secrets manager for credentials.
- If a secret was committed or shared, revoke/rotate it. Removing it from the latest files is not sufficient to remove it from Git history.
