import type { ArrayNode, DocumentNode, Location, ObjectNode, ValueNode } from '@humanwhocodes/momoa'
import { evaluate, parse } from '@humanwhocodes/momoa'
import { None, Some } from '@niamori/utils'
import type { Option } from '@niamori/utils'
import detectIndent from 'detect-indent'
import { diceCoefficient } from 'dice-coefficient'
import { z } from 'zod'

// TODO: separate `ReferenceNodeFinder` from `mimic`
export interface ReferenceNodeFinder {
  find(paths: string[]): Option<ValueNode>
}

export class BasicReferenceNodeFinder implements ReferenceNodeFinder {
  private constructor(private readonly tree: DocumentNode) {}

  public static from(tree: DocumentNode): ReferenceNodeFinder {
    return new BasicReferenceNodeFinder(tree)
  }

  find(paths: string[]): Option<ValueNode> {
    return find(this.tree.body, paths)

    function find(node: ValueNode, paths: string[]): Option<ValueNode> {
      if (paths.length === 0) {
        return Some(node)
      }

      if (node.type === 'Array') {
        const [head, ...tail] = paths
        const index = z.number().int().parse(Number(head))

        if (node.elements.length === 0) {
          return None
        }

        if (index >= 0 && index < node.elements.length) {
          return find(node.elements[index].value, tail)
        }

        return find(node.elements[node.elements.length - 1].value, tail)
      } else if (node.type === 'Object') {
        const [head, ...tail] = paths

        if (node.members.length === 0) {
          return None
        }

        const closest = [...node.members].sort((a, b) => {
          return diceCoefficient(b.name.value, head) - diceCoefficient(a.name.value, head)
        })[0]

        return find(closest.value, tail)
      } else {
        return None
      }
    }
  }
}

// TODO: implement a more sophisticated finder
export const referenceNodeFinder = {
  basic: BasicReferenceNodeFinder.from,
}

export function mimic(value: unknown, example: string) {
  const vString = JSON.stringify(value)
  const vTree = parse(vString, {
    mode: 'json',
    ranges: true,
    tokens: false,
  })

  const eString = example
  const eMatrix = eString.split('\n')
  const eTree = parse(example, {
    mode: 'json',
    ranges: true,
    tokens: true,
  })

  const { indent } = detectIndent(eString)

  const finder = BasicReferenceNodeFinder.from(eTree)
  function findReferenceNode(paths: string[]): Option<ValueNode> {
    return finder.find(paths)
  }

  function getLocationRange(node: ValueNode): [Location, Location] {
    const locationZod = z.object({
      line: z.number(),
      column: z.number(),
      offset: z.number(),
    })

    const locationRangeZod = z.object({
      start: locationZod,
      end: locationZod,
    })

    const loc = locationRangeZod.parse(node.loc)
    return [loc.start, loc.end]
  }

  function walk<T extends ValueNode>(vNode: T, paths: string[], indentColumns: number): string {
    function betweenIE(l: Location, r: Location, ignoreColumns: number = indentColumns) {
      if (l.line === r.line) {
        return eMatrix[l.line - 1].slice(l.column - 1, r.column - 1)
      } else {
        const h = eMatrix[l.line - 1].slice(l.column - 1)
        const t = eMatrix[r.line - 1].slice(ignoreColumns, r.column - 1)
        const m = Array.from({ length: r.line - l.line - 1 }, (_, i) => {
          return eMatrix[l.line + (i + 1) - 1].slice(ignoreColumns)
        })

        return [h, ...m, t].join('\n')
      }
    }

    function addIndent(str: string) {
      return str.split('\n').reduce((chunks, line, i) => {
        if (i === 0) {
          return [line]
        } else {
          if (line.trim() === '') {
            return [...chunks, line]
          } else {
            return [...chunks, indent + line]
          }
        }
      }, [] as string[]).join('\n')
    }

    if (vNode.type === 'Array') {
      const eNodeOption = findReferenceNode(paths)
        .filter(eNode => eNode.type === 'Array') as Option<ArrayNode>

      if (eNodeOption.is_none()) {
        return JSON.stringify(evaluate(vNode), null, indent)
      }

      const eNode = eNodeOption.unwrap()

      if (vNode.elements.length === 0) {
        if (eNode.elements.length === 0) {
          const [beg, end] = getLocationRange(eNode)

          return betweenIE(beg, end)
        } else {
          return '[]'
        }
      } else {
        if (eNode.elements.length === 0) {
          return JSON.stringify(evaluate(vNode), null, indent)
        } else {
          const [beg, end] = getLocationRange(eNode)
          const [lBeg, lEnd] = getLocationRange(eNode.elements[0].value)

          function getHeading() {
            return betweenIE(beg, lBeg)
          }

          const heading = getHeading()

          function getSeperator() {
            if (eNode.elements.length === 1) {
              if (heading.includes('\n')) {
                return ',\n'
              } else {
                return ', '
              }
            } else {
              const [mBeg, mEnd] = getLocationRange(eNode.elements[1].value)

              return betweenIE(lEnd, mBeg, indentColumns + indent.length)
            }
          }

          const seperator = getSeperator()

          function getTail() {
            const [rBeg, rEnd] = getLocationRange(eNode.elements[eNode.elements.length - 1].value)

            return betweenIE(rEnd, end)
          }

          const tail = getTail()

          const elements = vNode.elements.map((vElement, i) => {
            return walk(vElement.value, [...paths, String(i)], indentColumns + indent.length)
          })

          const elementString = elements.join(seperator)

          return `${heading}${addIndent(elementString)}${tail}`
        }
      }
    } else if (vNode.type === 'Object') {
      const eNodeOption = findReferenceNode(paths)
        .filter(eNode => eNode.type === 'Object') as Option<ObjectNode>

      if (eNodeOption.is_none()) {
        return JSON.stringify(evaluate(vNode), null, indent)
      }

      const eNode = eNodeOption.unwrap()

      if (vNode.members.length === 0) {
        if (eNode.members.length === 0) {
          const [beg, end] = getLocationRange(eNode)

          return betweenIE(beg, end)
        } else {
          return '{}'
        }
      } else {
        if (eNode.members.length === 0) {
          return JSON.stringify(evaluate(vNode), null, indent)
        } else {
          const [beg, end] = getLocationRange(eNode)
          const [lNameBeg, lNameEnd] = getLocationRange(eNode.members[0].name)
          const [lValueBeg, lValueEnd] = getLocationRange(eNode.members[0].value)

          function getHeading() {
            return betweenIE(beg, lNameBeg)
          }

          const heading = getHeading()

          function getColons() {
            return betweenIE(lNameEnd, lValueBeg)
          }

          const colons = getColons()

          function getTail() {
            const [rValueBeg, rValueEnd] = getLocationRange(eNode.members[eNode.members.length - 1].value)

            return betweenIE(rValueEnd, end)
          }

          const tail = getTail()

          const members = vNode.members.map((vMember, i) => {
            return {
              name: vMember.name.value,
              quotedName: `"${vMember.name.value}"`,
              value: walk(vMember.value, [...paths, vMember.name.value], indentColumns + indent.length),
            }
          }).sort(
            (a, b) => {
              const aIdx = eNode.members.findIndex(member => member.name.value === a.name)
              const bIdx = eNode.members.findIndex(member => member.name.value === b.name)

              if (aIdx === -1 && bIdx === -1) {
                return 0
              } else if (aIdx === -1 && bIdx !== -1) {
                return 1
              } else if (aIdx !== -1 && bIdx === -1) {
                return -1
              } else {
                return aIdx - bIdx
              }
            },
          )

          if (members.length === 1) {
            return `${heading}${members[0].quotedName}${colons}${addIndent(members[0].value)}${tail}`
          }

          if (eNode.members.length === 1) {
            const defaultSeperator = heading.includes('\n') ? ',\n' : ', '

            const memberString = members.map(it => `${it.quotedName}${colons}${it.value}`).join(defaultSeperator)
            const indentedMemberString = addIndent(memberString)

            return `${heading}${indentedMemberString}${tail}`
          }

          function inferSeperator(aName: string, bName: string) {
            function getSeperatorAfter(idx: number) {
              const [aValueBeg, aValueEnd] = getLocationRange(eNode.members[idx].value)
              const [bNameBeg, bNameEnd] = getLocationRange(eNode.members[idx + 1].name)

              return betweenIE(aValueEnd, bNameBeg, indentColumns + indent.length)
            }

            const defaultSeperator = getSeperatorAfter(0)

            const aIdx = eNode.members.findIndex(member => member.name.value === aName)
            const bIdx = eNode.members.findIndex(member => member.name.value === bName)

            if (aIdx === -1) {
              // bIndx must be -1 here, since unknown member is always at the end

              return defaultSeperator
            } else if (aIdx !== -1 && bIdx === -1) {
              if (aIdx === eNode.members.length - 1) {
                return defaultSeperator
              } else {
                return getSeperatorAfter(aIdx)
              }
            } else {
              // aIdx + 1 should exist here, since we have bIdx > aIdx
              return getSeperatorAfter(aIdx)
            }
          }

          const memberString = members.reduce((chunks, member, i) => {
            const self = `${member.quotedName}${colons}${member.value}`

            if (i !== members.length - 1) {
              const seperator = inferSeperator(member.name, members[i + 1].name)
              return [...chunks, self, seperator]
            } else {
              return [...chunks, self]
            }
          }, [] as string[]).join('')

          const indentedMemberString = addIndent(memberString)

          return `${heading}${indentedMemberString}${tail}`
        }
      }
    } else if (vNode.type === 'Null') {
      return JSON.stringify(null)
    } else {
      return JSON.stringify(vNode.value)
    }
  }

  const [beg, end] = getLocationRange(eTree.body)

  return eString.slice(0, beg.offset) + walk(vTree.body, [], 0) + eString.slice(end.offset)
}
