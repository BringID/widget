import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

// Remove nested @scure/bip32 node_modules to fix @noble/hashes exports conflict
execSync('rm -rf node_modules/@scure/bip32/node_modules', { stdio: 'inherit' })

// Patch @zkpassport/sdk ESM bundle - only webpack/SWC-safe fixes here.
// Node.js runtime-only fixes are applied in postbuild, after webpack runs.
const filePath = 'node_modules/@zkpassport/sdk/dist/esm/index.js'
let content = readFileSync(filePath, 'utf8')

// Reset any previously applied runtime-only patches (handles multiple applications)
content = content.replaceAll(
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;",
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';"
)
// Strip all occurrences of the JSON import attribute (handles double-application)
content = content.replace(/from'i18n-iso-countries\/langs\/en\.json'(\s*with\s*\{\s*type:\s*'json'\s*\})*/g,
  "from'i18n-iso-countries/langs/en.json'"
)

// Fix: buffer/ directory import not supported in Node.js ESM
content = content.replaceAll("from'buffer/'", "from'buffer'")

writeFileSync(filePath, content)
console.log('Patched @zkpassport/sdk ESM bundle (webpack-safe fixes)')
