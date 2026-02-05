import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },

  server: {
    DATABASE_URL: z.string(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    BETTER_AUTH_SECRET: z.string(),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    DATA_EXPORT_PATH: z.string().default('./.data/exports'),
  },

  clientPrefix: 'VITE_',
  client: {
    VITE_SITE_URL: z.string(),
  },
  // For Vite, this is import.meta.env.
  // We use `runtimeEnv` to provide all variables at once.
  runtimeEnv: typeof window !== 'undefined' ? import.meta.env : process.env,
  // runtimeEnv: process.env,
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  // skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so empty strings are treated as undefined.
   * `SOME_VAR: z.string().optional()` will be undefined if `SOME_VAR=` is in .env
   */
  emptyStringAsUndefined: true,
})
