import { cache } from '@h-ai/cache'
import { err, ok } from '@h-ai/core'
import { iam } from '@h-ai/iam'
import { reldb } from '@h-ai/reldb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminRole, listAdminPermissionsPage, listAdminRoles, resolvePermissionIds, updateAdminRole } from '../src/lib/server/iam-admin.js'
import { load as loadDashboard } from '../src/routes/admin/+page.server.js'

describe('admin read failures', () => {
  beforeEach(async () => {
    expect((await reldb.init({ type: 'sqlite', database: ':memory:' })).success).toBe(true)
    expect((await cache.init({ type: 'memory' })).success).toBe(true)
    expect((await iam.init({ seedDefaultData: false })).success).toBe(true)
  })
  afterEach(async () => {
    vi.restoreAllMocks()
    await iam.close()
    await cache.close()
    await reldb.close()
  })

  it('distinguishes empty data from an unavailable database', async () => {
    expect(await listAdminPermissionsPage({})).toMatchObject({ items: [], total: 0 })
    expect(await getAdminRole('missing')).toBeNull()
    await reldb.close()
    await expect(listAdminPermissionsPage({})).rejects.toMatchObject({ status: 503 })
    await expect(getAdminRole('missing')).rejects.toMatchObject({ status: 503 })
  })

  it('rejects the entire list when a later page fails', async () => {
    const pages = vi.spyOn(iam.authz, 'getAllRoles')
      .mockResolvedValueOnce(ok({ items: [], total: 201, page: 1, pageSize: 200 }))
      .mockResolvedValueOnce(err({ code: 'test.read_failed', message: 'injected failure' }))
    await expect(listAdminRoles()).rejects.toMatchObject({ status: 503 })
    expect(pages).toHaveBeenCalledTimes(2)
  })

  it('blocks editing and writes when existing permissions cannot be loaded', async () => {
    const role = await iam.authz.createRole({ code: 'read-failure', name: 'before' })
    expect(role.success).toBe(true)
    if (!role.success)
      return
    expect((await reldb.sql.execute('DROP TABLE hai_iam_role_permissions')).success).toBe(true)
    await expect(getAdminRole(role.data.id)).rejects.toMatchObject({ status: 503 })
    await expect(listAdminRoles()).rejects.toMatchObject({ status: 503 })
    await expect(updateAdminRole(role.data.id, { name: 'after', permissions: [] })).rejects.toMatchObject({ status: 503 })
    expect(await iam.authz.getRole(role.data.id)).toMatchObject({ success: true, data: { name: 'before' } })
  })

  it('rejects unknown permission codes and propagates lookup outages', async () => {
    expect(await resolvePermissionIds([])).toEqual([])
    await expect(resolvePermissionIds(['unknown:permission'])).rejects.toMatchObject({ status: 400 })
    await reldb.close()
    await expect(resolvePermissionIds(['unknown:permission'])).rejects.toMatchObject({ status: 503 })
  })

  it('fails dashboard loading rather than displaying zero statistics during an outage', async () => {
    await reldb.close()
    // 此 loader 不读取事件参数，用真实调用验证统计失败边界。
    await expect(loadDashboard({} as Parameters<typeof loadDashboard>[0])).rejects.toMatchObject({ status: 503 })
  })
})
