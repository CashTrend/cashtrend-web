#!/usr/bin/env node
/**
 * check.mjs -- Frontend quality-gate script for cashtrend-web.
 *
 * Runs the full verification pipeline in order:
 *   1. eslint . --fix     -- ESLint with auto-fix
 *   2. eslint .           -- verify no remaining lint errors
 *   3. tsc --noEmit       -- TypeScript type-check across the entire project
 *   4. next build         -- full production build (only when --build is passed)
 *
 * Cross-platform: works identically on Windows, Linux, and macOS.
 * All tool binaries are resolved from node_modules/.bin so no global installs
 * are required -- only `node_modules` must be present (run `pnpm install` first).
 *
 * Usage:
 *   node scripts/check.mjs             # lint + typecheck
 *   node scripts/check.mjs --build     # lint + typecheck + next build
 *   node scripts/check.mjs --no-color  # disable ANSI colour output
 *
 *   Or via package.json scripts:
 *   pnpm check            # lint + typecheck
 *   pnpm check:full       # lint + typecheck + next build
 *
 * Exit code 0 -- all checks passed.
 * Exit code 1 -- one or more checks failed.
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { platform } from 'node:os'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Path helpers (ESM equivalent of __dirname)
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Project root is one directory above the scripts/ folder.
const projectRoot = join(__dirname, '..')

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const withBuild = argv.includes('--build')
const noColor = argv.includes('--no-color') || !process.stdout.isTTY

// ---------------------------------------------------------------------------
// ANSI colour helpers
// ---------------------------------------------------------------------------

/**
 * Returns a tagged-template-style colour function.
 * When colour is disabled the text is returned unchanged.
 *
 * @param {string} code - ANSI colour code
 * @returns {(text: string) => string}
 */
function makeColor(code) {
  return (text) => (noColor ? text : `\x1b[${code}m${text}\x1b[0m`)
}

const c = {
  bold: makeColor('1'),
  green: makeColor('32'),
  red: makeColor('31'),
  yellow: makeColor('33'),
  cyan: makeColor('36'),
  dim: makeColor('2'),
}

// ---------------------------------------------------------------------------
// Binary resolution
// ---------------------------------------------------------------------------

const isWindows = platform() === 'win32'

/**
 * Resolve a CLI tool to its node_modules/.bin path.
 * On Windows, npm creates .cmd wrappers in .bin that must be used when
 * spawning via execFileSync without shell:true.
 *
 * Falls back to the bare name (relies on PATH) if the local binary is missing.
 *
 * @param {string} name - Tool name (e.g. 'eslint', 'tsc', 'next')
 * @returns {string} Absolute path to the binary or the name as fallback
 */
function bin(name) {
  // Windows: prefer the .cmd wrapper so it can be executed directly.
  const candidates = isWindows
    ? [
        join(projectRoot, 'node_modules', '.bin', `${name}.cmd`),
        join(projectRoot, 'node_modules', '.bin', `${name}.ps1`),
      ]
    : [join(projectRoot, 'node_modules', '.bin', name)]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  // Fallback: rely on PATH (useful if the tool is globally installed)
  return name
}

// ---------------------------------------------------------------------------
// Step runner
// ---------------------------------------------------------------------------

/** @type {Array<{title: string, ok: boolean}>} */
const results = []

/**
 * Execute a single pipeline step.
 *
 * Streams all output directly to the terminal (stdio: 'inherit').
 * Captures the pass/fail result for the summary section.
 *
 * @param {string} title   - Human-readable step label
 * @param {string} command - Executable path
 * @param {string[]} args  - Arguments to pass to the executable
 * @returns {boolean} True if the step exited with code 0
 */
function step(title, command, args) {
  console.log(`\n${c.bold(c.cyan(`>>  ${title}`))}`)
  console.log(c.dim(`   $ ${command} ${args.join(' ')}`))

  const start = Date.now()
  let ok = false

  try {
    execFileSync(command, args, {
      stdio: 'inherit',
      // On Windows, .cmd wrappers in node_modules/.bin must be invoked via the
      // shell (cmd.exe). On Linux/macOS the bin files are real executables and
      // do not need a shell. Using shell:true only on Windows avoids argument
      // quoting pitfalls on Unix while keeping full compatibility on Windows.
      shell: isWindows,
      // Run from the project root so ESLint and tsc pick up their config files.
      cwd: projectRoot,
    })
    ok = true
  } catch {
    // execFileSync throws on non-zero exit code.
    // Output has already been forwarded to the terminal via stdio:'inherit'.
    ok = false
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`   ${ok ? c.green('[OK]') : c.red('[FAIL]')} ${c.dim(`(${elapsed}s)`)}`)

  results.push({ title, ok })
  return ok
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

console.log(c.bold('\n+======================================+'))
console.log(c.bold('|   cashtrend-web -- Quality Gate      |'))
console.log(c.bold('+======================================+'))

// Step 1: ESLint -- auto-fix first so trivial issues are resolved automatically.
step('ESLint -- auto-fix', bin('eslint'), ['.', '--fix'])

// Step 2: ESLint -- re-run without --fix to confirm no violations remain.
// If any error survives step 1 (e.g. logic errors eslint cannot auto-resolve)
// this step will catch and report it.
step('ESLint -- verify no remaining errors', bin('eslint'), ['.'])

// Step 3: TypeScript type-check.
// Uses tsconfig.check.json which extends the main config but excludes .next/.
// The .next/types/validator.ts file auto-generated by Next.js can reference
// non-existent route handlers for rewrite-based proxy paths, which causes
// false type errors under bare tsc. The check config excludes that generated
// directory so only our actual source files are type-checked here.
step(
  'TypeScript -- type check (tsc --noEmit)',
  bin('tsc'),
  ['--noEmit', '--project', 'tsconfig.check.json'],
)

// Step 4 (optional): Full Next.js production build.
// Catches SSR errors, missing env vars referenced at build time, and
// import/export issues that only surface during bundling.
// Skipped by default because it takes several minutes.
if (withBuild) {
  step('Next.js -- production build', bin('next'), ['build'])
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const separator = c.bold('-'.repeat(42))
console.log(`\n${separator}`)
console.log(c.bold('  Summary'))
console.log(separator)

let allPassed = true
for (const { title, ok } of results) {
  console.log(`  ${ok ? c.green('[OK]  ') : c.red('[FAIL]')}  ${title}`)
  if (!ok) allPassed = false
}

console.log()
if (allPassed) {
  console.log(c.bold(c.green('  All checks passed. [OK]')))
} else {
  console.log(c.bold(c.red('  One or more checks failed. [FAIL]')))
}
console.log()

process.exit(allPassed ? 0 : 1)
