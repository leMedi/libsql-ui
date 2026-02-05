Title: Database Detail + Connection Info

Ticket: UI-005
Owner: TBD
Priority: Medium

Goal

- Provide a per-database landing page with connection info and an entry point to the SQL console.

In Scope

- Database detail page.
- Connection strings/snippets based on workspace baseUrl and DB name.
- Token placeholder guidance (no multi-user permissions).

Out of Scope

- Data browser UI beyond SQL console.

UX Requirements

- Show:
  - database name
  - workspace name + link back
  - connection URL (libsql)
  - example snippets:
    - libsql client (TS)
    - curl (if applicable)
- "Open SQL Console" primary action.

Acceptance Criteria

- Connection URL renders consistently and is copyable.
- Page loads even if metadata endpoints are unsupported.

Implementation Tasks

- Add route: src/routes/workspaces/$workspaceId/databases/$dbName.tsx.
- Implement helper to construct connection URLs and example snippets.

Test Plan

- Verify URL construction for baseUrl with/without trailing slash.
