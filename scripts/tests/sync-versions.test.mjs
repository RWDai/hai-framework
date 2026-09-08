import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { it } from 'vitest'

it('version checks are read-only, synchronization fixes drift, malformed manifests fail', () => {
  const root = mkdtempSync(join(tmpdir(), 'hai-version-test-'))
  try {
    mkdirSync(join(root, 'scripts'), { recursive: true })
    mkdirSync(join(root, 'apps/example'), { recursive: true })
    mkdirSync(join(root, 'packages/cli/templates/base'), { recursive: true })
    copyFileSync(new URL('../sync-versions.mjs', import.meta.url), join(root, 'scripts/sync-versions.mjs'))
    writeFileSync(join(root, 'package.json'), '{"version":"1.2.3"}')
    const app = join(root, 'apps/example/package.json')
    const template = join(root, 'packages/cli/templates/base/package.json.hbs')
    writeFileSync(app, '{"name":"app","version":"1.0.0"}')
    writeFileSync(template, '{"version":"1.0.0","dependencies":{"@h-ai/core":"^1.0.0"}}')
    const run = (...args) => spawnSync(process.execPath, [join(root, 'scripts/sync-versions.mjs'), ...args], { encoding: 'utf8' })
    assert.equal(run('--check').status, 1)
    assert.equal(JSON.parse(readFileSync(app, 'utf8')).version, '1.0.0')
    assert.match(readFileSync(template, 'utf8'), /\^1\.0\.0/)
    assert.equal(run().status, 0)
    assert.equal(JSON.parse(readFileSync(app, 'utf8')).version, '1.2.3')
    assert.match(readFileSync(template, 'utf8'), /\^1\.2\.3/)
    assert.equal(run('--check').status, 0)
    writeFileSync(app, 'broken JSON')
    assert.equal(run('--check').status, 1)
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})
