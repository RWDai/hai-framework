import type { HaiError, HaiResult } from '@h-ai/core'
import type { DeployRecoveryInfo } from './deploy-types.js'
import { err } from '@h-ai/core'
import { z } from 'zod'
import { deployM } from './deploy-i18n.js'

const RecoverySchema = z.object({
  projectName: z.string(),
  stage: z.string(),
  platformProjectId: z.string().optional(),
  resources: z.array(z.object({
    serviceType: z.enum(['db', 'cache', 'storage', 'email', 'sms']),
    provisionerName: z.string(),
    resourceInfo: z.string(),
    resourceStatus: z.enum(['created', 'reused', 'unknown']),
  })),
})

/** 读取错误中的恢复清单；仅返回明确允许展示的字段。 */
export function getDeployRecovery(error: HaiError): DeployRecoveryInfo | undefined {
  const parsed = RecoverySchema.safeParse(error.ext?.recovery)
  return parsed.success ? parsed.data : undefined
}

/** 在错误中保留可展示的恢复信息，避免异常 cause/命令/URL 泄漏凭证。 */
export function recoveryFailure(error: HaiError, recovery: DeployRecoveryInfo): HaiResult<never> {
  return err({
    code: error.code,
    httpStatus: error.httpStatus,
    system: error.system,
    module: error.module,
    message: deployM('deploy_recoveryFailure', { params: { stage: recovery.stage } }),
    suggestion: deployM('deploy_recoverySuggestion'),
    ext: { recovery },
  })
}
