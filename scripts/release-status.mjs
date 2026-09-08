/** 发布状态以实际 npm 版本与 GitHub Release 为准，不能只看 tag。 */
import { appendFileSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export function publicPackages(root) {
  return readdirSync(join(root, 'packages'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map((entry) => {
    const directory = `packages/${entry.name}`
    const pkg = JSON.parse(readFileSync(join(root, directory, 'package.json'), 'utf8'))
    return { ...pkg, directory }
  }).filter(pkg => !pkg.private)
}

export async function missingPackages(packages, fetcher = fetch) {
  const missing = []
  for (const pkg of packages) {
    const response = await fetcher(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.version)}`, { signal: AbortSignal.timeout(15000) })
    if (response.status === 404) {
      missing.push(pkg)
      continue
    }
    if (!response.ok)
      throw new Error(`npm registry status ${response.status} for ${pkg.name}`)
    const published = await response.json()
    if (published.version !== pkg.version)
      throw new Error(`npm registry returned an unexpected version for ${pkg.name}`)
  }
  return missing
}

export async function releasePending(packages, repository, version, options = {}) {
  const fetcher = options.fetcher ?? fetch
  const missing = await missingPackages(packages, fetcher)
  const response = await fetcher(`${options.apiUrl ?? 'https://api.github.com'}/repos/${repository}/releases/tags/${encodeURIComponent(`v${version}`)}`, {
    signal: AbortSignal.timeout(15000),
    headers: { Accept: 'application/vnd.github+json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
  })
  if (response.status === 404)
    return true
  if (!response.ok)
    throw new Error(`GitHub release lookup failed: ${response.status}`)
  const release = await response.json()
  return missing.length > 0 || release.draft === true
}

async function main() {
  const root = resolve(import.meta.dirname, '..')
  const packages = publicPackages(root)
  if (process.argv[2] === 'missing') {
    const missing = await missingPackages(packages)
    process.stdout.write(missing.map(pkg => `${pkg.directory}\n`).join(''))
    return
  }
  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_OUTPUT)
    throw new Error('GITHUB_REPOSITORY and GITHUB_OUTPUT are required for release status')
  const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const pending = await releasePending(packages, process.env.GITHUB_REPOSITORY, version, { token: process.env.GITHUB_TOKEN, apiUrl: process.env.GITHUB_API_URL })
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${pending}\nversion=${version}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
