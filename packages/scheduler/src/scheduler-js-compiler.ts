/**
 * @h-ai/scheduler — JS 任务编译器
 *
 * 将 JS 函数字符串编译为可执行函数，并基于源码缓存编译结果。
 * ⚠️ 仅用于受信任的服务端代码字符串；当前实现不是安全沙箱。
 * @module scheduler-js-compiler
 */

import type { HaiResult } from '@h-ai/core'

import type { JsTaskConfig, JsTaskHandler } from './scheduler-types.js'
import { createHash } from 'node:crypto'
import { Script } from 'node:vm'
import { Worker } from 'node:worker_threads'
import { err, ok } from '@h-ai/core'

import { schedulerM } from './scheduler-i18n.js'
import { HaiSchedulerError } from './scheduler-types.js'

/** 已编译 JS 处理器缓存 */
const compiledHandlerCache = new Map<string, JsTaskHandler>()

function createCacheKey(config: JsTaskConfig): string {
  // 缓存键包含 timeout，确保相同代码不同超时语义不会复用同一处理器
  const keySource = `${config.code}:${config.timeout ?? 0}`
  return createHash('sha256').update(keySource).digest('hex')
}

export function clearJsTaskHandlerCache(): void {
  compiledHandlerCache.clear()
}

export function compileJsTaskHandler(config: JsTaskConfig): HaiResult<JsTaskHandler> {
  const cacheKey = createCacheKey(config)
  const cachedHandler = compiledHandlerCache.get(cacheKey)
  if (cachedHandler)
    return ok(cachedHandler)

  try {
    // 主线程仅解析语法，不执行表达式或任务函数。
    void new Script(`(${config.code})`)

    const handler: JsTaskHandler = async (context) => {
      return await new Promise<unknown>((resolve, reject) => {
        const timeout = config.timeout ?? 30000
        const worker = new Worker(new URL('./scheduler-js-worker.js', import.meta.url), {
          workerData: { code: config.code, context },
          execArgv: [],
        })
        let settled = false
        let timer: ReturnType<typeof setTimeout> | undefined
        const finish = (error?: Error, result?: unknown) => {
          if (settled)
            return
          settled = true
          clearTimeout(timer)
          // 等待线程停止后才结束本次尝试，禁止超时任务与后续重试并行。
          void worker.terminate().then(() => error ? reject(error) : resolve(result), reject)
        }
        timer = setTimeout(() => finish(new Error(schedulerM('scheduler_jsTimedOut', { params: { timeout } }))), timeout)
        worker.once('error', error => finish(error instanceof Error ? error : new Error(String(error))))
        worker.once('exit', code => finish(new Error(`JS worker exited before returning a result (${code})`)))
        worker.once('message', (message: { success: boolean, data?: unknown, message?: string }) => {
          if (message.success)
            finish(undefined, message.data)
          else
            finish(new Error(message.message))
        })
      })
    }

    compiledHandlerCache.set(cacheKey, handler)
    return ok(handler)
  }
  catch (error) {
    return err(
      HaiSchedulerError.JS_COMPILE_FAILED,
      schedulerM('scheduler_jsCompileFailed', {
        params: { error: error instanceof Error ? error.message : String(error) },
      }),
      error,
    )
  }
}
