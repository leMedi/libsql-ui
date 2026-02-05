Title: Workspace Detail (Health + Version)

Ticket: UI-002
Owner: TBD
Priority: High

Goal

- Provide an inspect/admin landing page for a single workspace: server health, version/build, and a quick path to database operations.

In Scope

- Workspace detail page with:
  - health check status and latency
  - version/build info (if available)
  - capability badges (what operations are supported)
  - databases list section entry point
- Light polling for health.

Out of Scope

- Deep server config editing.
- Metrics dashboards.

UX Requirements

- Prominent status banner: Online/Offline/Unauthorized/Unknown.
- Show last check time + "Check now" button.
- Poll interval: 10-30s; pause polling when tab hidden.

Acceptance Criteria

- If server is unreachable, UI shows offline state and retains last-known data.
- If auth fails, UI shows unauthorized state with a link to edit workspace connection.
- Version/build info renders when available and otherwise shows "Not provided by server".

Implementation Tasks

- Add route: src/routes/workspaces/$workspaceId.tsx.
- Loader fetches workspace record + initial status via adapter.getStatus.
- Client-side polling hook (AbortController, visibility handling).
- Render capability badges for: list/create DB, sql, token ops.

Test Plan

- Simulate network failure and verify UI error states.
- Simulate 401 and verify unauthorized state.
