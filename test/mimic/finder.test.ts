import { describe, expect, it } from 'vitest'
import { parse } from '@humanwhocodes/momoa'
import { None } from '@niamori/utils'
import { referenceNodeFinder } from '@niamori/json-manipulator/mimic'

describe('finder', () => {
  describe.each(
    Object.keys(referenceNodeFinder) as (keyof typeof referenceNodeFinder)[],
  )('impl(%s)', (name) => {
    function find(json: string, paths: string[]) {
      return referenceNodeFinder[name](parse(json)).find(paths)
    }

    describe('robustness', () => {
      it('should return None when finding node in empty object', () => {
        expect(find('{}', ['a'])).toBe(None)
      })

      it('should return None when finding node in empty array', () => {
        expect(find('[]', ['0'])).toBe(None)
      })

      it('should return None when finding node in primitive value', () => {
        expect(find('true', ['a'])).toBe(None)
        expect(find('1', ['a'])).toBe(None)
        expect(find('"a"', ['a'])).toBe(None)
        expect(find('null', ['a'])).toBe(None)
      })
    })
  })
})
