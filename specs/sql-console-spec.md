Title: SQL Console (Per Database)

Ticket: UI-006
Owner: TBD
Priority: High

Goal

- Run SQL against a selected database and inspect results with a usable developer console experience.

In Scope

- SQL editor (multiline, tabs optional), run button, keyboard shortcut.
- Results table with columns/rows.
- Query history (per workspace/db).
- Schema explorer (tables/views/indexes) via SQL introspection if no API.

Out of Scope

- Visual query builder.
- Data editing UI (cell edit).

UX Requirements

- Default to safe SELECT limit:
  - if query has no LIMIT and looks like SELECT, append LIMIT 200 (configurable)
  - provide a toggle "Run as-is" with a warning
- Show query duration and rows count.
- Show errors with message + (optional) server details.

Schema Explorer Approach

- If server provides schema endpoint, use it.
- Otherwise, use standard SQLite introspection queries (best-effort):
  - list tables: SELECT name, type FROM sqlite*schema WHERE type IN ('table','view') AND name NOT LIKE 'sqlite*%'
  - table info: PRAGMA table_info(<table>)
  - indexes: PRAGMA index_list(<table>)

Acceptance Criteria

- User can execute SQL and see results.
- Errors render without crashing the page.
- History persists across reload (local storage or app DB).

Implementation Tasks

- Add route: src/routes/workspaces/$workspaceId/databases/$dbName/console.tsx.
- Implement adapter.executeSql.
- Build components:
  - SqlEditor
  - ResultsGrid
  - SchemaExplorer
- Persist history:
  - store last N queries per db (e.g. 50)

Test Plan

- Run SELECT, DDL, and invalid SQL.
- Verify LIMIT safety behavior.
