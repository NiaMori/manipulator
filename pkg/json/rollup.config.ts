import { defineConfig } from 'rollup'
import { esm } from '@niamori/rollup-config/presets'

export default defineConfig(await esm())
