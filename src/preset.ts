import type { TSConfigJSON } from 'types-tsconfig'
import type { PackageJSON } from 'types-pkg-json'

import type { Draft } from 'immer'
import { manipulateJson } from './manipulate'

interface Presets {
  'tsconfig.json': TSConfigJSON
  'package.json': PackageJSON
}

export const manipulate: {
  [T in keyof Presets]: typeof manipulateJson<T>
} = new Proxy(Object.create(null), {
  get: () => {
    return (text: string, recipe: (dr: Draft<any>) => void) => {
      return manipulateJson(text, recipe)
    }
  },
})

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest
  describe('manipulate presets', () => {
    describe.each(Object.keys(manipulate) as Array<keyof typeof manipulate>)('%s', (preset) => {
      it('should be identical to `manipulateJson`', () => {
        expect(manipulate[preset]).toBe(manipulateJson)
      })
    })
  })
}
