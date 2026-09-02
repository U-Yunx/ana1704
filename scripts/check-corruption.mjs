#!/usr/bin/env node
/**
 * Pre-deploy corruption guard for ANA24.
 *
 * Scans the source tree for the binary-blob corruption that previously broke
 * production builds. Files that should be UTF-8 text occasionally contained
 * stray control bytes (0x00, 0x1B, …) — the signature of the "30-byte blob"
 * corruption that made `tsconfig.json` and `vite.config.ts` unparseable on the
 * deploy server.
 *
 * This check exits non-zero with a clear report so a corrupted file can never
 * silently ship again. It runs automatically from `npm run predeploy`, which is
 * invoked by BOTH the GitHub Actions CI (`.github/workflows/deploy.yml`, before
 * the build) and the local `npm run deploy`.
 *
 * Usage:
 *   node scripts/check-corruption.mjs [root]
 * (root defaults to the current working directory)
 */
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const ROOT = process.argv[2]
  ? (process.argv[2].startsWith('/') ? process.argv[2] : join(process.cwd(), process.argv[2]))
  : process.cwd()

// Directories never scanned.
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  '.git',
  '.next',
  'coverage',
  '.cache',
])

// File extensions allowed to be binary. Everything else is checked as text.
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.avif', '.bmp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.zip', '.gz', '.tar', '.7z', '.pdf',
  '.mp3', '.mp4', '.webm', '.wasm', '.map',
])

// Stray control bytes that must never appear inside a UTF-8 source text file.
// LF (0x0A), CR (0x0D) and TAB (0x09) are legitimate and therefore excluded.
const BAD = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, acc)
    } else if (st.isFile() && !BINARY_EXT.has(extname(full).toLowerCase())) {
      acc.push(full)
    }
  }
  return acc
}

const files = walk(ROOT, [])
const hits = []

for (const f of files) {
  const buf = readFileSync(f)
  // latin1 maps each byte 1:1 to a char, so byte offsets are exact.
  const text = buf.toString('latin1')
  const match = BAD.exec(text)
  if (match) {
    const start = Math.max(0, match.index - 16)
    const context = buf
      .slice(start, match.index + 16)
      .toString('latin1')
      .replace(/[^\x20-\x7E]/g, '·')
    hits.push({
      file: relative(ROOT, f),
      offset: match.index,
      context,
    })
  }
}

if (hits.length > 0) {
  console.error('[check-corruption] ✗ Corrupted files found — fix these BEFORE deploying:')
  for (const h of hits) {
    console.error(`  - ${h.file}  (byte ${h.offset})  …${h.context}…`)
  }
  console.error(
    '\nThese files contain stray binary bytes and will break the build (or ship broken).\n' +
      'Restore clean content for each file, then re-run this check.',
  )
  process.exit(1)
}

console.log(
  `[check-corruption] ✓ Clean — ${files.length} source files scanned, no corruption.`,
)
process.exit(0)
