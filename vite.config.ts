import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    {
      name: 'copy-native-modules',
      closeBundle() {
        const modules = ['@libsql/linux-arm64-musl']
        modules.forEach((mod) => {
          const src = join('node_modules', mod)
          const dest = join('.output/server/node_modules', mod)
          mkdirSync(dest, { recursive: true })
          // Copy the module files
          copyFileSync(join(src, 'index.node'), join(dest, 'index.node'))
        })
      },
    },
  ],
})

export default config
