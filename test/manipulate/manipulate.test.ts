import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { kase } from './manipulate.utils'

describe('manipulate', () => {
  // TODO: add more tests besides the sanity check

  it('should pass the sanity check', async () => {
    const tsconfig = await fs.readFile(new URL('../../tsconfig.json', import.meta.url).pathname, 'utf8')

    expect(await kase(tsconfig, (dr) => {
      dr.compilerOptions.paths['@niamori.nope/core'] = ['./pkg/core']
      dr.compilerOptions.paths['@niamori.nope/core/*'] = ['./pkg/core/*']
    })).toMatchInlineSnapshot(`
      --- OLD_JSON
      +++ NEW_JSON
      @@ -20 +20,3 @@
      -      "@/*": ["./src/*"]
      +      "@/*": ["./src/*"],
      +      "@niamori.nope/core": ["./pkg/core"],
      +      "@niamori.nope/core/*": ["./pkg/core/*"]
    `)
  })
})
