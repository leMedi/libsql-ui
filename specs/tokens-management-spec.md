Title: Tokens Management

Ticket: UI-007
Owner: TBD
Priority: High

Goal

- Create and revoke tokens for a workspace (and optionally scoped to a database).

In Scope

- Tokens list page scoped to workspace.
- Create token form.
- Revoke token action.
- Copy-once token display flow.

Out of Scope

- Token usage analytics.
- Fine-grained RBAC.

UX Requirements

- List shows (best-effort): name, scopes, createdAt, expiresAt, lastUsedAt.
- Create token form fields:
  - name (required)
  - database (optional)
  - scopes (optional, if supported)
  - expiration (optional TTL)
- After creation:
  - show token string once in a modal with copy button
  - store only label/metadata by default (do not persist token secret)

Acceptance Criteria

- User can create a token and copy it.
- User can revoke a token and list refreshes.
- If listTokens is NOT_SUPPORTED, UI can still create tokens and show only locally-known labels (with a notice).

Implementation Tasks

- Add route: src/routes/workspaces/$workspaceId/tokens/index.tsx.
- Implement adapter.listTokens/createToken/revokeToken.
- Add local metadata store for token labels when server can’t list.

Test Plan

- Create token success + copy once.
- Revoke token success.
- NOT_SUPPORTED fallback path.
