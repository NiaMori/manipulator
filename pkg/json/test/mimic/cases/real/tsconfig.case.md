## v

```json
{
  "compilerOptions": {
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmit": true,

    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "ESNext",
    "moduleResolution": "node",

    "paths": {
      "@": ["./src"],
      "@/*": ["./src/*"]
    }
  },

  "include": [
    "src",
    "test"
  ]
}
```
