# Stage 0 — security stabilisation

Status: **implementation complete; production rollout and restore verification pending**

Last updated: 29 July 2026

The admin-only **Development → Roadmap** page is the user-facing status record. This
file retains the technical acceptance evidence alongside the code.

## Implemented

- Upgraded to Next.js 15.5.21, React 19.2 and patched transitive dependencies.
- Added a single explicit internal workspace and server-side workspace filtering.
- Preserved private per-user Knowledge and Procurement data.
- Added revocable database sessions and stronger password hashing.
- Added persistent login throttling and security event records.
- Added same-origin mutation checks, body-size limits and hardened response headers.
- Restricted the website webhook origin and added constant-time secret checking.
- Scoped backup exports to the internal workspace and excluded authentication secrets.
- Added an automatic production migration step before the Vercel build.
- Added an admin-only, code-versioned Development roadmap and progress record.
- Added user-scoped offline Knowledge drafts and an idempotent capture queue.
- Added a service-worker application shell that never caches authenticated API data.

## Required before Stage 0 is marked complete

1. Deploy migration `20260729090000_stage0_security_foundation`.
2. Confirm both internal users can sign in; existing sessions are expected to expire.
3. Confirm each user can read shared CRM records but only their own Knowledge notes.
4. Confirm a member cannot open `/development` or any `/api/admin/*` endpoint.
5. Download a workspace backup and retain its `X-Backup-SHA256` value from the response.
6. Restore the database backup into an isolated test database and compare record counts.
7. Test the website enquiry form after moving its secret to a server-side request header.
8. Review Vercel production response headers and application error logs.

## Deliberately deferred

- MFA or managed identity.
- Customer logins.
- Per-project permissions.
- Transactional, immutable engineering revision audit trails.
- Encrypted engineering file storage and malware scanning.

Those controls are required before the application holds externally accessible
customer project data.
