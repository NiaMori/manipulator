import type { TSConfigJSON } from 'types-tsconfig'
import type { PackageJSON } from 'types-pkg-json'

import { manipulateJson } from './manipulate'

interface Presets {
  'tsconfig.json': TSConfigJSON
  'package.json': PackageJSON
}

export const manipulate: {
  [T in keyof Presets]: typeof manipulateJson<T>
} = new Proxy(Object.create(null), {
  get: () => manipulateJson,
})

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest
  describe('manipulate presets', () => {
    describe.each([
      'tsconfig.json',
      'package.json',
    ] as const)('%s', (preset) => {
      it('should be identical to `manipulateJson`', () => {
        expect(manipulate[preset]).toBe(manipulateJson)
      })
    })
  })
}
