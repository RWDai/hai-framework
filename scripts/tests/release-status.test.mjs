import { describe, expect, it } from 'vitest'
import { missingPackages, releasePending } from '../release-status.mjs'

const packages = [{ name: '@h-ai/a', version: '1.0.0', directory: 'packages/a' }, { name: '@h-ai/b', version: '1.0.0', directory: 'packages/b' }]

describe('release recovery', () => {
  it('retries missing npm packages even when a release already exists', async () => {
    const fetcher = async url => url.includes('%40h-ai%2Fb')
      ? new Response('', { status: 404 })
      : Response.json(url.includes('api.github.com') ? { draft: false } : { version: '1.0.0' })
    expect((await missingPackages(packages, fetcher)).map(pkg => pkg.name)).toEqual(['@h-ai/b'])
    expect(await releasePending(packages, 'owner/repo', '1.0.0', { fetcher })).toBe(true)
  })

  it('repairs a missing GitHub release after npm publish succeeds', async () => {
    const fetcher = async url => url.includes('api.github.com') ? new Response('', { status: 404 }) : Response.json({ version: '1.0.0' })
    expect(await releasePending(packages, 'owner/repo', '1.0.0', { fetcher })).toBe(true)
  })

  it('skips only a complete release and never treats lookup failures as missing packages', async () => {
    const fetcher = async url => Response.json(url.includes('api.github.com') ? { draft: false } : { version: '1.0.0' })
    expect(await releasePending(packages, 'owner/repo', '1.0.0', { fetcher })).toBe(false)
    await expect(missingPackages(packages, async () => new Response('', { status: 503 }))).rejects.toThrow('503')
    await expect(releasePending([], 'owner/repo', '1.0.0', { fetcher: async () => new Response('', { status: 401 }) })).rejects.toThrow('401')
  })
})
