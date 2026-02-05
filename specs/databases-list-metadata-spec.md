Title: Databases List + Metadata

Ticket: UI-003
Owner: TBD
Priority: High

Goal

- Show all databases in a workspace and surface as much metadata as the server can provide.

In Scope

- Databases list view scoped to one workspace.
- Metadata fields displayed when available.
- Refresh button and basic sorting.

Out of Scope

- Backups, branching, replication views.
- Row-level data browsing (handled by SQL console spec).

Data To Display (best-effort)

- name (required)
- sizeBytes (optional)
- storage/filePath (optional)
- lastModifiedAt (optional)
- quick actions: Open SQL console, Copy connection URL

Discovery Strategy

- Preferred: use sqld admin endpoint to list databases + metadata.
- Fallback (if no list endpoint): show databases tracked by the UI registry (created via this UI).

Acceptance Criteria

- List renders from server if supported; otherwise from registry with a clear "limited view" notice.
- Clicking a database navigates to database detail.
- Refresh re-fetches and updates the list.

Implementation Tasks

- Add route: src/routes/workspaces/$workspaceId/databases/index.tsx.
- Implement adapter.listDatabases.
- Add registry fallback:
  - On create DB, store database name in app DB
  - For list, use registry when adapter throws NOT_SUPPORTED
- Render table with optional columns that hide when empty.

Test Plan

- With mocked NOT_SUPPORTED, list uses registry and shows notice.
