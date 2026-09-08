import process from 'node:process'
import { cache } from '@h-ai/cache'
import { reldb } from '@h-ai/reldb'

let scheduler

async function dispatch(command, args) {
  if (command === 'init') {
    scheduler = (await import(args.entry)).scheduler
    const database = await reldb.init({ type: 'sqlite', database: args.database })
    if (!database.success)
      return database
    const cached = await cache.init({ type: 'redis', host: args.host, port: args.port })
    if (!cached.success)
      return cached
    return scheduler.init({ enableDb: true, tickInterval: 100 })
  }
  if (command === 'tasks')
    return [...scheduler.tasks.values()]
  if (command === 'close') {
    await scheduler.close()
    await cache.close()
    await reldb.close()
    return { success: true }
  }
  return scheduler[command](...args)
}

process.on('message', ({ id, command, args }) => {
  void dispatch(command, args).then(
    data => process.send({ id, data }),
    error => process.send({ id, error: String(error) }),
  )
})
