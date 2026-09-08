/**
 * =============================================================================
 * Admin Console - 仪表盘数据加载
 * =============================================================================
 */

import type { PageServerLoad } from './$types'
import { requireAdminData } from '$lib/server/iam-admin.js'
import { audit } from '@h-ai/audit'
import { iam } from '@h-ai/iam'

export const load: PageServerLoad = async () => {
  // 所有无依赖查询合并为单次 Promise.all，减少串行等待
  const [usersResult, activeUsersResult, rolesResult, permissionsResult, recentAuditResult, auditStatsResult] = await Promise.all([
    iam.user.listUsers({ page: 1, pageSize: 1 }),
    iam.user.listUsers({ page: 1, pageSize: 1, enabled: true }),
    iam.authz.getAllRoles({ page: 1, pageSize: 1 }),
    iam.authz.getAllPermissions({ page: 1, pageSize: 1 }),
    audit.list({ pageSize: 10 }),
    audit.getStats(7),
  ])

  const userTotal = requireAdminData(usersResult).total
  const activeUserTotal = requireAdminData(activeUsersResult).total
  const roleTotal = requireAdminData(rolesResult).total
  const permissionTotal = requireAdminData(permissionsResult).total

  // 审计数据
  const recentActivity = requireAdminData(recentAuditResult).items
  const auditStats = requireAdminData(auditStatsResult)

  return {
    stats: {
      userCount: userTotal,
      roleCount: roleTotal,
      permissionCount: permissionTotal,
      activeUsers: activeUserTotal,
    },
    recentActivity,
    auditStats,
  }
}
