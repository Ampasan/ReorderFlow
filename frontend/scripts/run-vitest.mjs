import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const canonicalCwd =
  process.platform === 'win32' ? fs.realpathSync.native(process.cwd()) : process.cwd()
const vitestCli = path.join(canonicalCwd, 'node_modules/vitest/vitest.mjs')
const result = spawnSync(process.execPath, [vitestCli, ...process.argv.slice(2)], {
  cwd: canonicalCwd,
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)
