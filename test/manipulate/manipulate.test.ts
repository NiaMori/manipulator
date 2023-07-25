import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { kase } from './manipulate.utils.js'

describe('manipulate', () => {
  // TODO: add more tests besides the sanity check

  it('should pass the sanity check', async () => {
    const tsconfig = await fs.readFile(new URL('../../tsconfig.json', import.meta.url).pathname, 'utf8')

    expect(await kase(tsconfig, (dr) => {
      dr.include ||= []
      dr.include.push('nope')
    })).toMatchInlineSnapshot(`
      --- OLD_JSON
      +++ NEW_JSON
      @@ -28 +28 @@
      -  "include": ["src", "rollup.config.ts", "vitest.config.ts", "test"]
      +  "include": ["src", "rollup.config.ts", "vitest.config.ts", "test", "nope"]
    `)
  })
})
