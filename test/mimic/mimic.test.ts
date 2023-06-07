import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import fg from 'fast-glob'
import { Parser as MarkdownParser } from 'commonmark'
import { None, type Option, Some } from '@niamori/utils'
import { z } from 'zod'
import { charIn, createRegExp, digit, exactly, maybe, oneOrMore, word } from 'magic-regexp'
import { mimic } from '@/mimic'

interface Case {
  id: string
  only: boolean
  e: string
  v: string
  r: string
}

function *caseDataFromMarkdown(markdown: string): Generator<Pick<Case, 'e' | 'v' | 'r'>> {
  const ast = new MarkdownParser().parse(markdown)

  const walker = ast.walker()

  const dataMap = new Map<string, {
    e: Option<string>
    v: Option<string>
    r: Option<string>
  }>()

  const titlePattern = createRegExp(
    charIn('evr').as('section').at.lineStart(),
    maybe(word),
    maybe(
      exactly('('), oneOrMore(digit).as('id'), exactly(')'),
    ).at.lineEnd(),
  )

  while (true) {
    const entry = walker.next()

    if (!entry) {
      break
    }

    const { entering, node } = entry

    if (entering && node.type === 'heading' && node.level === 2) {
      const sibling = node.next

      if (sibling && sibling.type === 'code_block') {
        const title = z.string().parse(node.firstChild?.literal?.toLowerCase())
        const match = title.match(titlePattern)

        if (match) {
          const id = match.groups.id ?? '*'
          const section = z.union([z.literal('e'), z.literal('v'), z.literal('r')]).parse(match.groups.section)

          const prev = dataMap.get(id) ?? {
            e: None,
            v: None,
            r: None,
          }

          dataMap.set(id, {
            ...prev,
            [section]: Some(sibling.literal),
          })
        }
      }
    }
  }

  const defaultE = dataMap.get('*')?.e ?? None
  const defaultV = dataMap.get('*')?.v ?? None

  for (const [idx, it] of dataMap.entries()) {
    if (idx === '*' && dataMap.size > 1) {
      continue
    }

    const e = it.e.or(defaultE)
    const v = it.v.or(defaultV)
    const r = it.r

    yield {
      e: e.or(v).unwrap(),
      v: v.or(e).unwrap(),
      r: r.or(v).unwrap(),
    }
  }
}

function *cases(): Generator<Case> {
  const root = path.relative(process.cwd(), new URL('cases', import.meta.url).pathname)

  for (const entry of fg.sync(`${root}/**/*.md`)) {
    const casePath = entry.toString()
    const caseId = path.relative(root, casePath).replace(/[.]case[.]md$/, '')
    const markdown = fs.readFileSync(casePath, 'utf-8')

    for (const [idx, it] of [...caseDataFromMarkdown(markdown)].entries()) {
      yield {
        id: `${caseId}#${(idx + 1).toString().padStart(2, '0')}`,
        only: caseId.endsWith('.only'),
        e: it.e,
        v: it.v,
        r: it.r,
      }
    }
  }
}

describe('mimic', () => {
  describe('cases', () => {
    for (const kase of cases()) {
      const fn = () => {
        const result = mimic(JSON.parse(kase.v), kase.e)
        expect(result).toBe(kase.r)
      }

      if (kase.only && import.meta.vitest?.isWatchMode()) {
        // allow it.only when in watch mode (which means we're developing)

        // eslint-disable-next-line no-only-tests/no-only-tests
        it.only(kase.id, fn)
      } else {
        it(kase.id, fn)
      }
    }
  })
})
