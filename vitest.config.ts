import * as node_path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: node_path.resolve(__dirname, 'src') },
    ],
  },

  test: {
    includeSource: ['src/**/*.ts'],
  },
})
