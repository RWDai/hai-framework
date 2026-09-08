/** 等待可协作取消的操作；已开始的外部副作用须由调用方监听 signal 停止。 */
export async function waitWithSignal<T>(operation: () => T | Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted()
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(signal.reason)
    signal.addEventListener('abort', aborted, { once: true })
    Promise.resolve().then(operation).then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', aborted)
    })
  })
}
