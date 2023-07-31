import { type Draft, produce } from 'immer'
import type { PackageJSON } from 'types-pkg-json'
import type { TSConfigJSON } from 'types-tsconfig'
import type { F } from 'ts-toolbelt'
import * as R from 'ramda'
import { manipulateJson } from '@niamori/manipulator.json'
import { P, match } from 'ts-pattern'

export interface Manipulator {
  'json': {
    recipe: (dr: Draft<any>) => void
  }

  'package.json': {
    recipe: (dr: Draft<PackageJSON>) => void
  }

  'tsconfig.json': {
    recipe: (dr: Draft<TSConfigJSON>) => void
  }

  '.gitignore': {
    recipe: (dr: Draft<string[]>) => void
  }
}

export function manipulator<T extends keyof Manipulator>(type: T): F.Curry<(recipe: Manipulator[T]['recipe'], input: string) => string>

export function manipulator(type: keyof Manipulator): F.Curry<(recipe: (dr: Draft<any>) => any, input: string) => string> {
  return R.curry((recipe: (dr: Draft<any>) => any, input: string): string => {
    return match(type)
      .with(P.union('json', 'package.json', 'tsconfig.json'), () => {
        return manipulateJson(input, recipe)
      })
      .with('.gitignore', () => {
        return manipulateLines(input, recipe)
      })
      .exhaustive()
  })
}

function textToLines(input: string) {
  const trailingEmptyLines = input.match(/\n+$/)?.[0] ?? ''
  const inputWithoutTrailingEmptyLines = input.slice(0, input.length - trailingEmptyLines.length)
  const leadingEmptyLines = inputWithoutTrailingEmptyLines.match(/^\n+/)?.[0] ?? ''
  const content = inputWithoutTrailingEmptyLines.slice(leadingEmptyLines.length)

  const lines = []
  for (let i = 0; i < leadingEmptyLines.length; i++) {
    lines.push('')
  }

  if (content.length > 0) {
    lines.splice(lines.length, 0, ...content.split('\n'))
  }

  for (let i = 1; i < trailingEmptyLines.length; i++) {
    lines.push('')
  }

  return lines
}

function manipulateLines(input: string, recipe: (dr: Draft<string[]>) => void) {
  const lines = textToLines(input)
  const finalLines = produce(lines, recipe)
  const finalText = `${finalLines.join('\n')}\n`
  return finalText
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest
  describe('manipulateLines.internal.toLiens', () => {
    it('should pass the cases', () => {
      expect(textToLines('a\nb\nc')).toEqual(['a', 'b', 'c'])
      expect(textToLines('a\nb\nc\n')).toEqual(['a', 'b', 'c'])
      expect(textToLines('a\nb\nc\n\n')).toEqual(['a', 'b', 'c', ''])
      expect(textToLines('\n')).toEqual([])
      expect(textToLines('\na')).toEqual(['', 'a'])
      expect(textToLines('\na\n')).toEqual(['', 'a'])
      expect(textToLines('\n\na\n')).toEqual(['', '', 'a'])
      expect(textToLines('')).toEqual([])
    })
  })
}
