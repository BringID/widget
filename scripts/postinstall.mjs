import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

// Remove nested @scure/bip32 node_modules to fix @noble/hashes exports conflict
execSync('rm -rf node_modules/@scure/bip32/node_modules', { stdio: 'inherit' })

// Patch @zkpassport/sdk ESM bundle.
// @zkpassport/sdk is in serverExternalPackages so webpack never processes it —
// all Node.js runtime fixes are applied here.
const filePath = 'node_modules/@zkpassport/sdk/dist/esm/index.js'
let content = readFileSync(filePath, 'utf8')

// Reset any previously applied patches (idempotent)
content = content.replaceAll(
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;",
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';"
)
content = content.replace(
  /from'i18n-iso-countries\/langs\/en\.json'(\s*(with|assert)\s*\{[^}]*\})*/g,
  "from'i18n-iso-countries/langs/en.json'"
)

// Fix 1: buffer/ directory import not supported in Node.js ESM
content = content.replaceAll("from'buffer/'", "from'buffer'")

// Fix 2: JSON imports need an import attribute in Node.js ESM.
// Use 'assert' (not 'with') — supported on Node.js 18/20/22, whereas 'with' requires Node.js 21+
content = content.replaceAll(
  "from'i18n-iso-countries/langs/en.json'",
  "from'i18n-iso-countries/langs/en.json' assert { type: 'json' }"
)

// Fix 3: i18n-iso-countries is CJS — Node.js ESM can't use named imports from it
content = content.replaceAll(
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';",
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;"
)

writeFileSync(filePath, content)
console.log('Patched @zkpassport/sdk ESM bundle')
