# TanStack Start + shadcn/ui + Better Auth

This project uses TanStack Start, shadcn/ui, and now integrates [better-auth](https://github.com/better-auth/better-auth) for authentication with Google social login.

## Authentication Setup (better-auth)

### Features

- Google OAuth login
- Session management via SQLite (Drizzle ORM)
- tRPC protected procedures

### Setup Steps

1. **Install dependencies**:
   ```bash
   pnpm add better-auth @better-auth/cli
   ```
2. **Environment variables**: Add these to your `.env`:

   ```env
   BETTER_AUTH_SECRET=your-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   VITE_SITE_URL=http://localhost:3000
   ```

   - `VITE_SITE_URL` must match your Google OAuth redirect URI.

3. **Database migration**:
   - Auth tables (`user`, `account`, `session`, `verification_token`) are defined in `src/db/schema/auth-schema.ts`.
   - Run:
     ```bash
     pnpm db:push
     ```
4. **Auth configuration**:
   - See `src/lib/auth.ts` for Better Auth setup with Drizzle adapter and Google provider.
   - API route: `src/routes/api/auth/$.ts`.
5. **tRPC protection**:
   - `protectedProcedure` in `src/trpc/init.ts` ensures only authenticated users can access protected endpoints.
   - tRPC context includes `session` and `currentUser`.
6. **Client usage**:
   - Use `authClient` from `src/lib/auth-client.ts` in React components for login/logout/session.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Set up your `.env` as above.
3. Run database migration:
   ```bash
   pnpm db:push
   ```
4. Start dev server:
   ```bash
   pnpm dev
   ```

## Useful Links

- [Better Auth Docs](https://github.com/better-auth/better-auth)
- [TanStack Start](https://tanstack.com/start)
- [shadcn/ui](https://ui.shadcn.com/)
