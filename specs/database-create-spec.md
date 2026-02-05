Title: Create Database (Storage Options)

Ticket: UI-004
Owner: TBD
Priority: High

Goal

- Create a new database on a workspace with configurable storage options.

In Scope

- Create database form + submission.
- Storage options UI that maps to adapter.createDatabase.
- Success path navigates to database detail.

Out of Scope

- Seeding/migrations.
- Backups/restore.

Form Requirements

- name (required, [a-zA-Z0-9_-], min 1)
- storage type:
  - file (default)
  - memory
  - custom
- storage path (required for file/custom if server needs it)
- advanced options key/value (optional; only if server supports)

Error Handling

- 409/duplicate name: show "Database already exists".
- NOT_SUPPORTED: show "This server does not support creating databases via API".

Acceptance Criteria

- Valid submission creates DB and appears in the databases list.
- User sees progress state; submit disabled while pending.
- On success, UI stores the DB name in registry (for fallback listing).

Implementation Tasks

- Add route: src/routes/workspaces/$workspaceId/databases/new.tsx.
- Implement adapter.createDatabase.
- Add optimistic update to list query cache.

Test Plan

- Create DB success path.
- Duplicate name error path.
