import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/budget-book/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // '@/' 만 src로 매핑 (@tanstack 등 scoped 패키지와 충돌 방지)
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
