import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@niamori/json-manipulator', replacement: new URL('src', import.meta.url).pathname },
    ],
  },

  test: {
    includeSource: ['src/**/*.ts'],
  },
})
