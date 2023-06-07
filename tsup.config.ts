import { defineConfig } from 'tsup'

export default defineConfig(options => ({
  entry: [
    'src/index.ts',
  ],
  format: [
    'esm',
    'cjs',
  ],
  target: 'esnext',
  dts: true,
  sourcemap: !!options.watch,
  clean: true,

  define: {
    'import.meta.vitest': 'undefined',
  },
}))
