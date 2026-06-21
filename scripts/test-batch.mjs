#!/usr/bin/env node
/**
 * Run vitest in small batches (separate processes) to limit peak memory.
 * Each batch exits fully before the next one starts.
 *
 * Usage:
 *   node scripts/test-batch.mjs [--coverage] [--batch-size=N]
 *
 * Env:
 *   TEST_BATCH_SIZE — files per batch (default: 6)
 */

import { spawn } from "node:child_process"
import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(fileURLToPath(import.meta.url), "..", "..")

const args = process.argv.slice(2)
const withCoverage = args.includes("--coverage")
const batchSizeArg = args.find((a) => a.startsWith("--batch-size="))
const BATCH_SIZE = batchSizeArg
  ? Math.max(1, parseInt(batchSizeArg.split("=")[1], 10))
  : Math.max(1, parseInt(process.env.TEST_BATCH_SIZE ?? "6", 10))

function collectTestFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectTestFiles(full, acc)
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      acc.push(relative(ROOT, full))
    }
  }
  return acc
}

function chunk(items, size) {
  const batches = []
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size))
  }
  return batches
}

function runVitestBatch(files, { batchIndex, totalBatches, cleanCoverage }) {
  return new Promise((resolve) => {
    const vitestArgs = [
      "vitest",
      "run",
      ...files,
      "--maxWorkers=1",
      "--pool=forks",
      "--poolOptions.forks.singleFork=true",
      "--no-file-parallelism",
    ]

    if (withCoverage) {
      vitestArgs.push("--coverage")
      if (!cleanCoverage) {
        vitestArgs.push("--coverage.clean=false")
      }
    }

    console.log(
      `\n--- Batch ${batchIndex + 1}/${totalBatches} (${files.length} file(s)) ---`
    )
    for (const file of files) {
      console.log(`  • ${file}`)
    }
    console.log()

    const child = spawn("npx", vitestArgs, {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, "--max-old-space-size=512"]
          .filter(Boolean)
          .join(" "),
      },
    })

    child.on("error", (err) => {
      console.error(`Failed to start vitest batch ${batchIndex + 1}:`, err)
      resolve(1)
    })

    child.on("close", (code, signal) => {
      if (signal) {
        console.error(`Batch ${batchIndex + 1} killed by signal ${signal}`)
        resolve(1)
      } else {
        resolve(code ?? 1)
      }
    })
  })
}

async function main() {
  const libTestsDir = join(ROOT, "lib")
  const allFiles = collectTestFiles(libTestsDir).sort()

  if (allFiles.length === 0) {
    console.error("No test files found under lib/")
    process.exit(1)
  }

  const batches = chunk(allFiles, BATCH_SIZE)

  console.log(
    `Running ${allFiles.length} test file(s) in ${batches.length} batch(es)` +
      ` (batch size: ${BATCH_SIZE}${withCoverage ? ", with coverage" : ""})`
  )

  let failed = false

  for (let i = 0; i < batches.length; i++) {
    const code = await runVitestBatch(batches[i], {
      batchIndex: i,
      totalBatches: batches.length,
      cleanCoverage: i === 0,
    })
    if (code !== 0) {
      failed = true
      console.error(`\nBatch ${i + 1} failed (exit ${code}). Stopping.`)
      break
    }
  }

  if (failed) {
    process.exit(1)
  }

  console.log(`\nAll ${batches.length} batch(es) passed.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
