## 1. Project Overview & Tech Stack

This is a **TanStack Start** application with React 19, TypeScript, and shadcn/ui components. TanStack Start is a full-stack React framework built on TanStack Router, providing file-based routing, SSR/SSG capabilities, and built-in devtools.

### Stack Components

- **Framework:** TanStack Start (React 19, Nitro backend)
- **Router:** TanStack Router (File-based routing in `src/routes/`)
- **State Management:** TanStack Query
- **UI:** Tailwind CSS v4, shadcn/ui (Base UI variant "base-lyra"), HugeIcons
- **Runtime:** Node.js with pnpm
- **Build Tool:** Vite with multiple plugins (devtools, nitro, tanstack-start)
- **Environment:** t3-env for type-safe environment variables

## 2. Architecture & Patterns

### Key Architectural Patterns

**File-Based Routing**
Routes are defined in `src/routes/` with automatic route tree generation:

- `__root.tsx` - Root layout with document shell, devtools, and global styles
- `index.tsx` - Home page route
- `routeTree.gen.ts` - Auto-generated route tree (DO NOT edit manually)

Routes use TanStack Router's `createFileRoute()` or `createRootRoute()` API.

**Path Aliases**
All imports from `src/` should use `@/` alias (e.g., `import { cn } from '@/lib/utils'`).

**Component Organization**

- `src/components/ui/` - shadcn/ui components (Base UI primitives).
- `src/components/` - Custom domain components.
- UI components use `@base-ui/react` primitives (not Radix UI).
- Icons use `@hugeicons` (not lucid-react).

**Environment Variables**

- Defined in `src/env.ts` using `t3-env`.
- Client-side variables must be prefixed with `VITE_`.
- **ALWAYS** use `env` from `@/env`. **NEVER** use `process.env` or `import.meta.env` directly.

## 3. TanStack Form (React)

- **Package:** `@tanstack/react-form`
- **Form setup:** `useForm({ defaultValues, validators, onSubmit })`
- **Validation:** use Zod in `validators.onChange`
- **Field binding:** `<form.Field name="..."></form.Field>` with `field.state.value`, `field.handleChange`, `field.handleBlur`, `field.state.meta.errors`
- **Submit/reset:** `form.handleSubmit()`, `form.reset(values)`, `form.setFieldValue(field, updater)`
- **State flags:** `form.state.canSubmit`, `form.state.isSubmitting`, `form.state.isSubmitted`
- **Combobox tip:** when using object values, set `isItemEqualToValue`
- **Error display:** when rendering `field.state.meta.errors`, extract `.message` (fallback to string) to avoid `[object Object]`

## 4. Build, Lint, & Test Commands

Use `pnpm` for all scripts.

| Command                    | Description                                                        |
| :------------------------- | :----------------------------------------------------------------- |
| `pnpm dev`                 | Start development server on port 3000                              |
| `pnpm build`               | Production build (Vite + Nitro)                                    |
| `pnpm preview`             | Preview production build                                           |
| `pnpm test`                | Run all tests (Vitest)                                             |
| `pnpm test <file>`         | Run tests for a specific file (e.g. `pnpm test src/utils.test.ts`) |
| `pnpm test -t "<pattern>"` | Run tests matching a pattern                                       |
| `pnpm lint`                | Run ESLint                                                         |
| `pnpm format`              | Run Prettier check                                                 |
| `pnpm check`               | Run Prettier write + ESLint fix (Use this after changes!)          |

### Adding shadcn/ui Components

This project uses the **base-lyra** style variant with HugeIcons.
Command: `pnpx shadcn@latest add <component-name>`

## 4. Code Style & Conventions

### General

- **Formatting:** Prettier with **no semicolons**, **single quotes**, and **trailing commas**.
- **TypeScript:** Strict mode enabled. No unused locals/parameters. Use `.ts`/`.tsx` extensions in imports.
- **Naming:** `camelCase` (functions/vars), `PascalCase` (components/classes), `kebab-case` (files).

### Components (React)

- **Structure:** Functional components.
- **Props:** inline prop types on component. Use `cn()` for class merging.
- **Pattern:**

```tsx
import { Primitive } from '@base-ui/react/primitive'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variants = cva('base-classes', { ... })

function Component({ className, ...props }: Props) {
  return <Primitive className={cn(variants({ className }))} {...props} />
}
```

## 5. Directory Structure

```
src/
├── components/     # React components
│   └── ui/         # shadcn/ui (Base UI) components
├── lib/            # Utilities (utils.ts, trpc.ts)
├── routes/         # TanStack Router routes
├── env.ts          # Environment schema
├── router.tsx      # Router configuration
└── styles.css      # Tailwind and global styles
```

## 7. Copilot/Agent Instructions (Summary)

- **UI Library:** This project uses `shadcn/ui` based on `@base-ui/react` (not Radix).
- **Icons:** Use `@hugeicons/react`.
- **ClassNames:** Always merge with `cn()`.
- **Strictness:** Do not introduce `any` types. Fix all lint errors.
- **Self-Correction:** If a build or lint command fails, fix the code, do not disable the rule unless absolutely necessary.
- **Refactoring:** When modifying code, preserve existing conventions. Run `pnpm check` before finishing.
- **Imports:** Prefer named imports. Avoid circular dependencies.
- **Route Tree:** Never manually edit `routeTree.gen.ts`.
