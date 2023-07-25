import { describe, expect, it } from 'vitest'
import { kase } from './manipulate.utils.js'

describe('manipulate', () => {
  describe('from chatgpt', () => {
    describe('object mutation', () => {
      it('should correctly add a new property to an object', async () => {
        const json = '{"id1": {"done": false, "body": "Take out the trash"}}'
        expect(await kase(json, (dr) => {
          dr.id2 = { done: false, body: 'Check Email' }
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"id1": {"done": false, "body": "Take out the trash"}}
          +{"id1": {"done": false, "body": "Take out the trash"}, "id2": {"done": false, "body": "Check Email"}}
        `)
      })

      it('should correctly delete a property from an object', async () => {
        const json = '{"id1": {"done": false, "body": "Take out the trash"}, "id2": {"done": false, "body": "Check Email"}}'
        expect(await kase(json, (dr) => {
          delete dr.id1
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"id1": {"done": false, "body": "Take out the trash"}, "id2": {"done": false, "body": "Check Email"}}
          +{"id2": {"done": false, "body": "Check Email"}}
        `)
      })

      it('should correctly update a property in an object', async () => {
        const json = '{"id1": {"done": false, "body": "Take out the trash"}}'
        expect(await kase(json, (dr) => {
          dr.id1.done = true
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"id1": {"done": false, "body": "Take out the trash"}}
          +{"id1": {"done": true, "body": "Take out the trash"}}
        `)
      })

      it('should correctly handle multiple operations on an object', async () => {
        const json = '{"id1": {"done": false, "body": "Take out the trash"}, "id2": {"done": false, "body": "Check Email"}}'
        expect(await kase(json, (dr) => {
          dr.id1.done = true
          dr.id2.body = 'Read a book'
          dr.id3 = { done: false, body: 'Go for a walk' }
          delete dr.id2
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"id1": {"done": false, "body": "Take out the trash"}, "id2": {"done": false, "body": "Check Email"}}
          +{"id1": {"done": true, "body": "Take out the trash"}, "id3": {"done": false, "body": "Go for a walk"}}
        `)
      })
    })

    describe('array mutation', () => {
      it('should correctly add an element to an array', async () => {
        const json = '[{"id": "id1", "done": false, "body": "Take out the trash"}]'
        expect(await kase(json, (dr) => {
          dr.push({ id: 'id2', done: false, body: 'Check Email' })
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -[{"id": "id1", "done": false, "body": "Take out the trash"}]
          +[{"id": "id1", "done": false, "body": "Take out the trash"}, {"id": "id2", "done": false, "body": "Check Email"}]
        `)
      })

      it('should correctly delete an element from an array by index', async () => {
        const json = '[{"id": "id1", "done": false, "body": "Take out the trash"}, {"id": "id2", "done": false, "body": "Check Email"}]'
        expect(await kase(json, (dr) => {
          dr.splice(0, 1)
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -[{"id": "id1", "done": false, "body": "Take out the trash"}, {"id": "id2", "done": false, "body": "Check Email"}]
          +[{"id": "id2", "done": false, "body": "Check Email"}]
        `)
      })

      it('should correctly update an element in an array by index', async () => {
        const json = '[{"id": "id1", "done": false, "body": "Take out the trash"}]'
        expect(await kase(json, (dr) => {
          dr[0].done = true
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -[{"id": "id1", "done": false, "body": "Take out the trash"}]
          +[{"id": "id1", "done": true, "body": "Take out the trash"}]
        `)
      })

      it('should correctly handle multiple operations on an array', async () => {
        const json = '[{"id": "id1", "done": false, "body": "Take out the trash"}, {"id": "id2", "done": false, "body": "Check Email"}]'
        expect(await kase(json, (dr) => {
          dr[0].done = true
          dr[1].body = 'Read a book'
          dr.push({ id: 'id3', done: false, body: 'Go for a walk' })
          dr.splice(1, 1)
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -[{"id": "id1", "done": false, "body": "Take out the trash"}, {"id": "id2", "done": false, "body": "Check Email"}]
          +[{"id": "id1", "done": true, "body": "Take out the trash"}, {"id": "id3", "done": false, "body": "Go for a walk"}]
        `)
      })
    })

    describe('nest', () => {
      it('should correctly handle nested data structures', async () => {
        const json = '{"users": {"17": {"name": "Michel", "todos": [{"title": "Get coffee", "done": false}]}}}'
        expect(await kase(json, (dr) => {
          dr.users['17'].todos[0].done = true
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"users": {"17": {"name": "Michel", "todos": [{"title": "Get coffee", "done": false}]}}}
          +{"users": {"17": {"name": "Michel", "todos": [{"title": "Get coffee", "done": true}]}}}
        `)
      })

      it('should correctly handle complex operations on nested data structures', async () => {
        const json = '{"users": {"17": {"name": "Michel", "todos": [{"title": "Get coffee", "done": false}, {"title": "Read a book", "done": false}]}}}'
        expect(await kase(json, (dr) => {
          dr.users['17'].name = 'John'
          dr.users['17'].todos[0].done = true
          dr.users['17'].todos[1].title = 'Go for a walk'
          dr.users['17'].todos.push({ title: 'Buy groceries', done: false })
          dr.users['18'] = { name: 'Jane', todos: [{ title: 'Do laundry', done: false }] }
          dr.users['17'].todos.splice(1, 1)
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"users": {"17": {"name": "Michel", "todos": [{"title": "Get coffee", "done": false}, {"title": "Read a book", "done": false}]}}}
          +{"users": {"17": {"name": "John", "todos": [{"title": "Get coffee", "done": true}, {"title": "Buy groceries", "done": false}]}, "18": {"name": "Jane", "todos": [{"title": "Do laundry", "done": false}]}}}
        `)
      })
    })

    describe('preserve original formatting', () => {
      it('should preserve original formatting with spaces after brackets', async () => {
        const json = '{ "id1": { "done": false, "body": "Take out the trash" } }'
        expect(await kase(json, (dr) => {
          dr.id1.done = true
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{ "id1": { "done": false, "body": "Take out the trash" } }
          +{ "id1": { "done": true, "body": "Take out the trash" } }
        `)
      })

      it('should preserve original formatting with newlines after brackets', async () => {
        const json = `{
"id1": {
"done": false,
"body": "Take out the trash"
}
}`
        expect(await kase(json, (dr) => {
          dr.id1.done = true
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -3 +3 @@
          -"done": false,
          +"done": true,
        `)
      })

      it('should preserve original formatting with spaces around colon', async () => {
        const json = '{"id1" : {"done" : false, "body" : "Take out the trash"}}'
        expect(await kase(json, (dr) => {
          dr.id1.done = true
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -1 +1 @@
          -{"id1" : {"done" : false, "body" : "Take out the trash"}}
          +{"id1" : {"done" : true, "body" : "Take out the trash"}}
        `)
      })

      it('should preserve original formatting with some properties on one line and some not', async () => {
        const json = `{
  "id1": {"done": false, "body": "Take out the trash"},
  "id2": {
    "done": false,
    "body": "Check Email"
  }
}`
        expect(await kase(json, (dr) => {
          dr.id1.done = true
          dr.id2.body = 'Read a book'
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -2 +2 @@
          -  "id1": {"done": false, "body": "Take out the trash"},
          +  "id1": {"done": true, "body": "Take out the trash"},
          @@ -5 +5 @@
          -    "body": "Check Email"
          +    "body": "Read a book"
        `)
      })

      it('should preserve original formatting with nested properties on one line and some not', async () => {
        const json = `{
  "id1": {
    "done": false,
    "body": "Take out the trash",
    "details": {"time": "10:00", "location": "Kitchen"}
  },
  "id2": {
    "done": false,
    "body": "Check Email",
    "details": {
      "time": "11:00",
      "location": "Office"
    }
  }
}`
        expect(await kase(json, (dr) => {
          dr.id1.done = true
          dr.id1.details.time = '10:30'
          dr.id2.body = 'Read a book'
          dr.id2.details.location = 'Library'
        })).toMatchInlineSnapshot(`
          --- OLD_JSON
          +++ NEW_JSON
          @@ -3 +3 @@
          -    "done": false,
          +    "done": true,
          @@ -5 +5 @@
          -    "details": {"time": "10:00", "location": "Kitchen"}
          +    "details": {"time": "10:30", "location": "Kitchen"}
          @@ -9 +9 @@
          -    "body": "Check Email",
          +    "body": "Read a book",
          @@ -12 +12 @@
          -      "location": "Office"
          +      "location": "Library"
        `)
      })
    })
  })
})
