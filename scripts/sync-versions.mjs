#!/usr/bin/env node
/** 版本同步在提交前执行；--check 只校验，CI 不修改已经验收的发布文件。 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'

const root = resolve(import.meta.dirname, '..')
const check = process.argv.includes('--check')

function main() {
  const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  if (typeof version !== 'string' || !version)
    throw new Error('Root package version is required')
  const changes = []
  for (const parent of ['packages', 'apps']) {
    for (const entry of readdirSync(join(root, parent), { withFileTypes: true })) {
      const file = join(root, parent, entry.name, 'package.json')
      if (!entry.isDirectory() || !existsSync(file))
        continue
      const original = readFileSync(file, 'utf8')
      const pkg = JSON.parse(original)
      if (pkg.version !== version) {
        pkg.version = version
        changes.push({ file, content: `${JSON.stringify(pkg, null, 2)}\n` })
      }
    }
  }
  const template = join(root, 'packages/cli/templates/base/package.json.hbs')
  const original = readFileSync(template, 'utf8')
  const content = original.replace(/"version"\s*:\s*"[^"]*"/, `"version": "${version}"`)
    .replace(/("@h-ai\/[^"\s]+"\s*:\s*")\^[^"]*(")/g, `$1^${version}$2`)
  if (content !== original)
    changes.push({ file: template, content })

  if (check && changes.length > 0) {
    process.stderr.write(`Version drift detected; run node scripts/sync-versions.mjs before validation:\n${changes.map(change => change.file).join('\n')}\n`)
    process.exitCode = 1
    return
  }
  if (!check) {
    for (const change of changes)
      writeFileSync(change.file, change.content, 'utf8')
  }
  process.stdout.write(`Version ${version}: ${check ? 'verified' : `updated ${changes.length} files`}\n`)
}

try {
  main()
}
catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
