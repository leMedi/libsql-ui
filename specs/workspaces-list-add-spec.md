Title: Workspaces List + Add Workspace

Ticket: UI-001
Owner: TBD
Priority: High

Goal

- Let a user register sqld servers as "workspaces" and navigate into a workspace.

In Scope

- Workspaces index page with list, empty state, and add flow.
- Persist workspace connection settings locally (app DB or local storage).
- Basic validation (URL, unique name).

Out of Scope

- Multi-user and permissions.
- Secrets encryption at rest (can be a follow-up; warn the user).

User Stories

- As a user, I can add a workspace by providing name + sqld URL so I can manage that server.
- As a user, I can optionally attach an admin auth method so the UI can call admin endpoints.
- As a user, I can see all workspaces and open one.

UX Requirements

- Workspaces list shows: name, baseUrl, current health badge (if known), last checked time.
- Add workspace is a dialog or dedicated page (prefer dedicated page if form is big).
- Form fields:
  - name (required)
  - baseUrl (required, https://...)
  - auth type: none | bearer token | custom header
  - auth value (conditionally required)
  - insecure TLS toggle (optional; default off)
- Copy/preview: show the exact base URL used for API calls.

Data Requirements

- Store WorkspaceConnection:
  - id (uuid)
  - name
  - baseUrl
  - auth (type + token/header)
  - insecureTls
  - createdAt

Acceptance Criteria

- Add workspace persists and shows up in list after reload.
- Invalid URLs or duplicate names are blocked with inline errors.
- Clicking a workspace navigates to workspace detail route.
- Workspace can be removed from the list (with confirm) OR not implemented (explicitly mark as follow-up).

Implementation Tasks

- Add routes:
  - src/routes/workspaces/index.tsx
  - src/routes/workspaces/new.tsx (or modal within index)
- Create workspace store (choose one):
  - Option A: Drizzle table in app DB
  - Option B: localStorage (faster to start)
- Add UI components:
  - WorkspaceCard / WorkspaceTable
  - AddWorkspaceForm
- Integrate sqld-api-adapter getStatus for last-known health (optional initial).

Test Plan

- Add/edit/remove workspace persists across reload.
- Bad baseUrl rejected.
