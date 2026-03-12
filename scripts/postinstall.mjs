import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

// Remove nested @scure/bip32 node_modules to fix @noble/hashes exports conflict
execSync('rm -rf node_modules/@scure/bip32/node_modules', { stdio: 'inherit' })

// Patch @zkpassport/sdk ESM bundle.
// @zkpassport/sdk is in serverExternalPackages so webpack never processes it —
// all Node.js 20.10+ runtime fixes can be applied here safely.
const filePath = 'node_modules/@zkpassport/sdk/dist/esm/index.js'
let content = readFileSync(filePath, 'utf8')

// Reset any previously applied patches (handles multiple applications)
content = content.replaceAll(
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;",
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';"
)
content = content.replace(
  /from'i18n-iso-countries\/langs\/en\.json'(\s*with\s*\{\s*type:\s*'json'\s*\})*/g,
  "from'i18n-iso-countries/langs/en.json'"
)

// Fix 1: buffer/ directory import not supported in Node.js ESM
content = content.replaceAll("from'buffer/'", "from'buffer'")

// Fix 2: JSON imports require "with { type: 'json' }" in Node.js 20.10+
content = content.replaceAll(
  "from'i18n-iso-countries/langs/en.json'",
  "from'i18n-iso-countries/langs/en.json' with { type: 'json' }"
)

// Fix 3: i18n-iso-countries is CJS — Node.js ESM can't use named imports from it
content = content.replaceAll(
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';",
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;"
)

writeFileSync(filePath, content)
console.log('Patched @zkpassport/sdk ESM bundle')
