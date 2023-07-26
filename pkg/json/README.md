# @niamori/json-manipulator

`@niamori/json-manipulator` let you edit json text while keeping the original formatting as much as possible.

## Installation

`@niamori/json-manipulator` is available on [npm](https://www.npmjs.com/package/@niamori/json-manipulator)

```bash
npm i @niamori/json-manipulator
```

## Quick Start

```js
import { manipulateJson } from '@niamori/json-manipulator'

const json = `{
  "compilerOptions": {
    "lib": ["ESNext"]
  }
}`

const newJson = manipulateJson(json, (dr) => {
  dr.compilerOptions.lib.push('DOM') // manipulate the JSON as if it were a normal mutable object
})

// `newJson` should be equal to `expectedJson` here
const expectedJson = `{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"]
  }
}`
```

The array `compilerOptions.lib` retains the original compact format while the rest of the JSON is untouched.

```jsonc
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"] // <-- magic happens here
  }
}
```

## Documentation

### The `manipulateJson` Function

```ts
function manipulateJson<T = unknown>(text: string, recipe: (dr: Draft<T>) => void): string
```

`manipulateJson` takes a JSON **string** and a recipe function and returns a new JSON string.

> Hint: `manipulateJson` need the original string rather than the parsed JSON object

The `dr` argument of the recipe function is a proxy to the JSON object which you can manipulate as if it were a normal mutable object.

> See [immer's documentation](https://immerjs.github.io/immer/update-patterns) for more details of update patterns using draft proxies.

In typescript, the type parameter `T` can be used to specify the type of the JSON object, which is useful for type checking and auto-completion.

```ts
manipulateJson<{ foo: string }>('{"foo": "bar"}', (dr) => {
  dr.foo = 1 // type error here
})
```

### Type Presets

`@niamori/json-manipulator` provides some type presets for common json files.

The `manipulate['*']` is the same function as `manipulateJson` above, but with the type parameter `T` set to the corresponding type definition.

```ts
import fs from 'node:fs'
import { manipulate } from '@niamori/json-manipulator'

const packageJson = fs.readFileSync('package.json', 'utf-8')

const newPackageJson = manipulate['package.json'](packageJson, (pkg) => {
  pkg.dependencies['@niamori/json-manipulator'] = '^1.0.0' // type checking and auto-completion for package.json happens here
})
```

The available presets and their corresponding types are listed below:

| name | type definition provided by |
| ---- | ---- |
| `package.json` | [types-pkg-json](https://github.com/bconnorwhite/types-pkg-json) |
| `tsconfig.json` | [types-tsconfig](https://github.com/bconnorwhite/types-tsconfig) |

## Notes

- The library is still in its early stage and the API may change in the future until it reaches its first stable version v1.0.0
- The library is originally designed for manipulating **small** JSON configuration files, so it may not be suitable for large JSON files.
- The library now only supports standard JSON format. Things like JSON with comments or trailing commas will not work as expected yet.
- Since the goal of "keeping the original formatting" is not well-defined to some extent, the library may not work as you expected in some cases. If you find any bugs or have any suggestions, please feel free to open an issue or pull request.
