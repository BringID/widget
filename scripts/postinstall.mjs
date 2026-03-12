import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, createWriteStream } from 'fs'
import { execSync } from 'child_process'
import { Readable } from 'stream'
import { finished } from 'stream/promises'

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

// Pre-download CRS for zkpassport WASM verification (avoids cold-start timeout on Vercel).
// Only runs in Vercel/CI build environments — skip locally to keep yarn install fast.
if (process.env.VERCEL || process.env.CI) {
  const crsDir = 'crs-cache'
  const g1Path = `${crsDir}/bn254_g1.dat`
  const g2Path = `${crsDir}/bn254_g2.dat`
  // 2^20 = 1,048,576 points = 64 MB — sufficient for all zkpassport passport circuits
  const NUM_POINTS = 1 << 20
  const g1Size = NUM_POINTS * 64

  mkdirSync(crsDir, { recursive: true })

  const g1Exists = existsSync(g1Path) && statSync(g1Path).size >= g1Size
  const g2Exists = existsSync(g2Path) && statSync(g2Path).size === 128

  if (g1Exists && g2Exists) {
    console.log('CRS already cached, skipping download')
  } else {
    try {
      console.log(`Downloading CRS (${NUM_POINTS} points = ${g1Size / 1024 / 1024} MB)...`)
      const [g1Res, g2Res] = await Promise.all([
        fetch('https://crs.aztec.network/g1.dat', { headers: { Range: `bytes=0-${g1Size - 1}` } }),
        fetch('https://crs.aztec.network/g2.dat'),
      ])
      await Promise.all([
        finished(Readable.fromWeb(g1Res.body).pipe(createWriteStream(g1Path))),
        finished(Readable.fromWeb(g2Res.body).pipe(createWriteStream(g2Path))),
      ])
      console.log('CRS downloaded successfully')
    } catch (err) {
      console.warn('CRS pre-download failed (will download at runtime):', err.message)
    }
  }
}
