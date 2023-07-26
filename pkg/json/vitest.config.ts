import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@niamori/manipulator.json', replacement: new URL('src', import.meta.url).pathname },
    ],
  },

  test: {
    includeSource: ['src/**/*.ts'],
  },
})
