import { expect } from 'vitest'
import type { Draft } from 'immer'
import { produce } from 'immer'
import { $ } from 'zx'
import { z } from 'zod'
import { manipulateJson } from '@niamori/json-manipulator/manipulate'

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

export async function kase<T = any>(json: string, recipe: (dr: Draft<T>) => void): Promise<string> {
  const newValue = produce<T>(JSON.parse(json), recipe)
  const newJson = manipulateJson<T>(json, recipe)

  expect(JSON.parse(newJson)).toEqual(JSON.parse(JSON.stringify(newValue)))

  return await diff(json, newJson)
}
