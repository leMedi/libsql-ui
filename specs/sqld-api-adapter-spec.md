Title: sqld Admin API Adapter

Ticket: UI-000
Owner: TBD
Priority: High

Goal

- Provide a single TypeScript client interface for all workspace (sqld server) admin operations the UI needs.

Background

- UI features (workspaces, databases, SQL console, tokens) should not depend on raw fetch calls scattered across routes/components.
- sqld deployments may differ (endpoints/capabilities). The adapter should allow stubbing and graceful degradation.

In Scope

- Define an adapter interface (TypeScript) used by loaders/actions/components.
- Implement a concrete HTTP adapter using fetch.
- Standardize error handling (network vs auth vs server error) and capability detection.
- Support per-workspace auth (e.g. bearer token or header) without introducing multi-user RBAC.

Out of Scope

- Multi-user auth/permissions.
- Backups/restore/replication controls.
- Telemetry/billing.

Requirements

- Adapter methods are async, typed, and return structured results.
- Adapter methods accept a WorkspaceConnection object (baseUrl + auth config).
- All requests have timeout + abort.
- Normalize errors into a small set of UI-friendly error codes.

Proposed Types

```ts
export type WorkspaceAuth =
  | { type: 'none' }
  | { type: 'bearer'; token: string }
  | { type: 'header'; name: string; value: string }

export interface WorkspaceConnection {
  id: string
  name: string
  baseUrl: string
  auth: WorkspaceAuth
  insecureTls?: boolean
}

export type SqldCapability =
  | 'health'
  | 'version'
  | 'listDatabases'
  | 'createDatabase'
  | 'sql'
  | 'listTokens'
  | 'createToken'
  | 'revokeToken'

export interface WorkspaceStatus {
  ok: boolean
  checkedAt: string
  latencyMs: number
  version?: string
  build?: string
  capabilities: SqldCapability[]
}

export interface DatabaseInfo {
  name: string
  sizeBytes?: number
  filePath?: string
  storage?: string
  lastModifiedAt?: string
}

export interface CreateDatabaseInput {
  name: string
  storage?: {
    type: 'file' | 'memory' | 'custom'
    path?: string
    options?: Record<string, string>
  }
}

export interface SqlRequest {
  sql: string
  args?: unknown[]
}

export interface SqlResult {
  columns: string[]
  rows: unknown[][]
  rowsAffected?: number
  lastInsertRowid?: string
  durationMs: number
}

export interface TokenInfo {
  id?: string
  name: string
  createdAt?: string
  expiresAt?: string
  scopes?: string[]
  lastUsedAt?: string
}

export interface CreateTokenInput {
  name: string
  scopes?: string[]
  expiresInSeconds?: number
  database?: string
}

export interface CreateTokenOutput {
  token: string
  info?: TokenInfo
}

export type SqldAdminErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'NOT_SUPPORTED'
  | 'BAD_REQUEST'
  | 'SERVER'

export class SqldAdminError extends Error {
  code: SqldAdminErrorCode
  status?: number
  details?: unknown
}

export interface SqldAdminClient {
  getStatus(conn: WorkspaceConnection): Promise<WorkspaceStatus>
  listDatabases(conn: WorkspaceConnection): Promise<DatabaseInfo[]>
  createDatabase(
    conn: WorkspaceConnection,
    input: CreateDatabaseInput,
  ): Promise<DatabaseInfo>
  executeSql(
    conn: WorkspaceConnection,
    dbName: string,
    req: SqlRequest,
  ): Promise<SqlResult>
  listTokens(conn: WorkspaceConnection): Promise<TokenInfo[]>
  createToken(
    conn: WorkspaceConnection,
    input: CreateTokenInput,
  ): Promise<CreateTokenOutput>
  revokeToken(conn: WorkspaceConnection, tokenIdOrName: string): Promise<void>
}
```

Endpoint Mapping (TBD)

- Document a mapping table once the sqld admin endpoints are confirmed.
- If sqld does not support one of these operations, throw SqldAdminError(code='NOT_SUPPORTED').

Acceptance Criteria

- UI can call a single adapter for all operations and receives typed results.
- Unsupported operations fail with NOT_SUPPORTED and include a user-friendly message.
- Network errors and 401/403 errors are distinguishable.
- All adapter calls support aborting (route navigation cancels in-flight requests).

Implementation Tasks

- Create adapter module under src/lib/ (e.g. src/lib/sqld-admin.ts).
- Implement request helper (baseUrl join, auth headers, timeout).
- Implement getStatus with best-effort capability detection.
- Stub listDatabases/createDatabase/sql/tokens methods behind endpoint constants.

Test Plan

- Unit-test request helper (headers, baseUrl join, timeout).
- Mock fetch responses for each error class.
