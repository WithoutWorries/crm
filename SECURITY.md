# Security policy

Reference stores private consultancy, commercial and engineering information. Treat
all application data, backups and environment variables as confidential.

## Current trust boundary

- The application is for a maximum of two trusted internal users.
- CRM, enquiry and activity data is shared inside one internal workspace.
- Knowledge notes are private to their author.
- Procurement records are private to their author.
- Customers must not receive internal accounts. External access requires the
  project-scoped authorization model planned for Stage 7.

Authorization is enforced in server-side queries. Hiding a navigation item is never
treated as an access control.

## Implemented controls

- Scrypt password hashing with automatic migration from legacy PBKDF2 hashes.
- Revocable, expiring database-backed sessions in secure HTTP-only cookies.
- Persistent login throttling and security event records.
- Same-origin checks for state-changing browser requests.
- Per-route and global request-size limits.
- Workspace-scoped CRM queries and user-scoped private records.
- HSTS, clickjacking, MIME-sniffing, referrer, permissions and content security headers.
- Security-patched framework and dependency baseline.
- Admin-only workspace backup that omits password hashes, calendar tokens and sessions.
- User-scoped, idempotent offline Knowledge capture with no API-response caching.
- Owner-scoped recoverable Knowledge deletion with deliberate permanent deletion and
  automatic 30-day retention cleanup.

## Offline device data

An unfinished Knowledge draft, its optional type, and captures awaiting synchronisation are stored in the
browser's IndexedDB on that Mac or iPhone. The service worker caches only the application
shell and static assets; it does not cache search results, API responses or server-held
Knowledge records.

The queue is separated by authenticated user ID, and the server rejects a queued item
whose owner does not match the active session. Signing out removes the remembered local
identity but deliberately does not delete unsynchronised notes. They become accessible
again only when the same user signs back in.

IndexedDB is protected by the device and operating-system account, not by separate
application-level encryption. Use FileVault and a strong Mac login password, and use an
iPhone passcode. A locally queued note is not included in server backups until
synchronisation succeeds. Capture metadata such as Wisdom, Decision or Reference follows
the same user-scoped local queue as the note text.

## Secrets

Production secrets belong in Vercel environment variables, never source control.
`SESSION_SECRET` must be at least 32 unpredictable characters. Rotate it after any
suspected disclosure; rotation signs every user out. API keys and webhook secrets
must be distinct from login passwords.

The website enquiry endpoint supports `X-Webhook-Secret` for server-to-server calls.
Legacy request-body secret support remains only for migration of the existing website
form. Move that call behind a server-side handler, then remove body-secret support.
A secret embedded in browser JavaScript is not confidential.

## AI data handling

Quick Capture and the daily digest send selected text to Anthropic. Do not submit
export-controlled, customer-restricted, personal medical, or otherwise contractually
restricted information unless the applicable data-processing terms permit it. Future
analysis features must record when source material leaves the application and must
support a project policy that disables external AI processing.

## Operational response

If compromise is suspected:

1. Disable affected accounts and rotate `SESSION_SECRET`.
2. Rotate database, Anthropic, Resend, cron and webhook credentials as applicable.
3. Review Vercel logs, login records and security events.
4. Preserve evidence before deleting records.
5. Restore only from a verified backup and validate record counts and access boundaries.

Do not publish vulnerability details or real customer data in public issues.
