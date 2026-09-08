import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { scheduler } from '../src/index.js'

describe('scheduler HTTP response boundaries', () => {
  afterEach(async () => {
    await scheduler.close()
  })

  it('times out a stalled response body and rejects oversized bodies', async () => {
    const server = createServer((request, response) => {
      if (request.url === '/stalled') {
        response.writeHead(200)
        response.write('headers received')
        return
      }
      if (request.url === '/large') {
        response.end('x'.repeat(1024 * 1024 + 1))
        return
      }
      if (request.url === '/error') {
        response.writeHead(503)
        response.end('unavailable')
        return
      }
      response.end('完成 😀')
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    try {
      expect((await scheduler.init({ enableDb: false })).success).toBe(true)
      const address = server.address() as AddressInfo
      const run = async (path: string) => {
        expect((await scheduler.register({
          id: path,
          name: path,
          cron: '* * * * *',
          handler: { kind: 'api', url: `http://127.0.0.1:${address.port}/${path}`, timeout: 250 },
        })).success).toBe(true)
        const result = await scheduler.trigger(path)
        expect(result.success).toBe(true)
        if (!result.success)
          throw new Error(result.error.message)
        return result.data
      }
      const stalled = await run('stalled')
      expect(stalled.status).toBe('failed')
      expect(stalled.duration).toBeLessThan(2000)
      expect((await run('large')).status).toBe('failed')
      expect((await run('error')).status).toBe('failed')
      const normal = await run('normal')
      expect(normal.status).toBe('success')
      expect(normal.result).toBe('完成 😀')
      expect((await scheduler.register({
        id: 'close-http',
        name: 'close-http',
        cron: '* * * * *',
        handler: { kind: 'api', url: `http://127.0.0.1:${address.port}/stalled`, timeout: 60000 },
      })).success).toBe(true)
      const requestStarted = new Promise<void>(resolve => server.once('request', () => resolve()))
      const pending = scheduler.trigger('close-http')
      await requestStarted
      await scheduler.close()
      const cancelled = await pending
      expect(cancelled.success).toBe(true)
      if (cancelled.success) {
        expect(cancelled.data.status).toBe('interrupted')
        expect(cancelled.data.duration).toBeLessThan(2000)
      }
    }
    finally {
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })
})
