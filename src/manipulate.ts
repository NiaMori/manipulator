import type { Draft } from 'immer'
import { produce } from 'immer'
import { mimic } from './mimic'

export function manipulateJson<T = unknown>(text: string, recipe: (dr: Draft<T>) => void): string {
  const value = JSON.parse(text) as T

  const finalValue = produce(value, recipe)

  // TODO: use patch-based approach
  const finalText = mimic(finalValue, text)

  return finalText
}
