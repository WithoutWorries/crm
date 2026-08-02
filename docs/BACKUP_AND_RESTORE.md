# Backup and restore runbook

## What the in-app export contains

An administrator can use **Admin → Users → Download backup**. The JSON export includes
the internal workspace, workspace CRM records, the exporting administrator's private
Knowledge notes, user-owned Procurement records for internal users, audit records,
login records and security events.

It intentionally excludes password hashes, session tokens, calendar tokens, login
throttle keys and environment secrets. Another user's private Knowledge notes are not
included in an administrator's export.

Offline drafts and queued Knowledge captures live only on the originating device until
the server confirms synchronisation. They are not present in database or JSON backups
before that confirmation. Check that the Knowledge panel says the device queue is clear
before wiping, replacing or signing out permanently from a device.

Knowledge notes in Recently Deleted remain in server backups during their 30-day
recovery window. Once a note is deleted permanently or removed by retention cleanup, it
can only be recovered from a backup created before that removal.

The response includes `X-Backup-SHA256`. Record the digest with the filename so a later
restore drill can prove the file has not changed. Store exports in encrypted storage;
the JSON itself is not encrypted.

## Database-level backup

The JSON export is portable evidence, not a complete PostgreSQL disaster-recovery
image. Database-level recovery must use the PostgreSQL provider's backup or point-in-time
recovery facility. Confirm that facility is enabled in the Neon project and that its
retention period meets contractual needs.

Before a major schema migration:

1. Download an in-app export.
2. Create or verify a database-provider restore point.
3. Record the migration name, export filename, digest and time in the Development log.

## Restore drill

Perform at least quarterly and before customer access is introduced:

1. Create an isolated non-production PostgreSQL database.
2. Restore the provider backup into it.
3. configure a local application instance with a new `SESSION_SECRET`.
4. Run `npm run db:deploy`.
5. Compare table and export record counts.
6. Verify internal workspace sharing, private Knowledge isolation and admin restrictions.
7. Delete the isolated copy securely after documenting the result.

Do not test restores against production. The current JSON format does not yet have an
automated importer; use the provider backup for recovery and the JSON export for
independent comparison and future portability.
