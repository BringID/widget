import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

// Remove nested @scure/bip32 node_modules to fix @noble/hashes exports conflict
execSync('rm -rf node_modules/@scure/bip32/node_modules', { stdio: 'inherit' })

// Patch @zkpassport/sdk ESM bundle packaging issues
const filePath = 'node_modules/@zkpassport/sdk/dist/esm/index.js'
let content = readFileSync(filePath, 'utf8')

// Fix 1: buffer/ directory import not supported in Node.js ESM
content = content.replaceAll("from'buffer/'", "from'buffer'")

// Fix 2: JSON import requires type attribute in Node.js 20.10+
content = content.replaceAll(
  "from'i18n-iso-countries/langs/en.json'",
  "from'i18n-iso-countries/langs/en.json' with { type: 'json' }"
)

// Fix 3: i18n-iso-countries is CJS and doesn't support named ESM imports
content = content.replaceAll(
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';",
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;"
)

writeFileSync(filePath, content)
console.log('Patched @zkpassport/sdk ESM bundle successfully')
