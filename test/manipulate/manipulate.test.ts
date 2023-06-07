import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import type { Draft } from 'immer'
import { produce } from 'immer'
import { $ } from 'zx'
import { z } from 'zod'
import { manipulateJson } from '@'

expect.addSnapshotSerializer({
  test: value => typeof value === 'string',
  serialize: string => string,
})

async function diff(aString: string, bString: string): Promise<string> {
  try {
    await $`diff -U0 --label OLD_JSON <(echo ${aString}) --label NEW_JSON <(echo ${bString})`.quiet()
    return ''
  } catch (e) {
    return z.object({
      stdout: z.string(),
    }).parse(e).stdout
  }
}

async function kase<T = any>(json: string, recipe: (dr: Draft<T>) => void): Promise<string> {
  const newValue = produce(JSON.parse(json), recipe)
  const newJson = manipulateJson<T>(json, recipe)

  expect(JSON.parse(newJson)).toEqual(newValue)

  return await diff(json, newJson)
}

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
