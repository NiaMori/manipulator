import { describe, expect, it } from 'vitest'
import { manipulator } from '@niamori/manipulator.core/index'

expect.addSnapshotSerializer({
  test: value => typeof value === 'string',
  serialize: string => string,
})

describe('manipulator', () => {
  describe('json', () => {
    // json manipulations should be extensively tested in @niamori/manipulator.json
    it.each(['package.json', 'tsconfig.json', 'json'] as const)('should pass the sanity check', (type) => {
      const tor = manipulator(type)

      const input = '{ "hello": "world" }'
      const output = '{ "hello": "noworld" }'
      const recipe = (dr: any) => {
        dr.hello = 'noworld'
      }

      expect(tor(recipe, input)).toBe(output)
      expect(tor(recipe)(input)).toBe(output)
    })
  })

  describe('.gitignore', () => {
    it('should pass the sanity check', () => {
      const tor = manipulator('.gitignore')

      const input = '/node_modules\n/dist\n'

      expect(tor((dr) => {
        dr.push('/coverage')
      })(input)).toMatchInlineSnapshot(`
        /node_modules
        /dist
        /coverage
      `)
    })
  })
})
