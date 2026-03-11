import { readFileSync, writeFileSync } from 'fs'

// Apply Node.js runtime patches AFTER webpack/SWC build completes.
// These fixes are not SWC-compatible but are required for Node.js 20.10+ ESM runtime.
const filePath = 'node_modules/@zkpassport/sdk/dist/esm/index.js'
let content = readFileSync(filePath, 'utf8')

// Fix 1: JSON imports require "with { type: 'json' }" in Node.js 20.10+
// (SWC can't parse this syntax, so it must be applied after the webpack build)
content = content.replaceAll(
  "from'i18n-iso-countries/langs/en.json'",
  "from'i18n-iso-countries/langs/en.json' with { type: 'json' }"
)

// Fix 2: i18n-iso-countries is CJS — Node.js ESM can't use named imports from it.
// Replace named import with default import + destructuring.
// Applied after build because SWC requires all imports before any other statements.
content = content.replaceAll(
  "import {registerLocale,getAlpha3Code}from'i18n-iso-countries';",
  "import _i18nIsoCountries from'i18n-iso-countries';const {registerLocale,getAlpha3Code}=_i18nIsoCountries;"
)

writeFileSync(filePath, content)
console.log('Patched @zkpassport/sdk ESM bundle (Node.js runtime fixes)')
