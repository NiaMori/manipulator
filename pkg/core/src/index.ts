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

function manipulateLines(input: string, recipe: (dr: Draft<string[]>) => void) {
  const lines = input.endsWith('\n') ? input.split('\n').slice(0, -1) : input.split('\n')
  const finalLines = produce(lines, recipe)
  const finalText = `${finalLines.join('\n')}\n`
  return finalText
}
