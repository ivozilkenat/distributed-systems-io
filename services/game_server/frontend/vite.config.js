import { defineConfig } from 'vite'
import path from 'path'
import { resolve } from 'path'

export default defineConfig({
    base: `dist/`,
  resolve: {
    alias: {
      "/dist": path.resolve(__dirname, "./"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})