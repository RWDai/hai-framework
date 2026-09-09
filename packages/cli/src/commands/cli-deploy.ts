/**
 * @h-ai/cli — 部署命令
 *
 * 使用: hai deploy [appDir]
 * @module cli-deploy
 */

import type { GlobalOptions } from '../cli-types.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { core } from '@h-ai/core'
import chalk from 'chalk'
import ora from 'ora'
import { parse } from 'yaml'
import { cliM } from '../cli-i18n.js'

/** deploy 命令选项 */
export interface DeployCommandOptions extends GlobalOptions {
  /** 应用目录 */
  appDir?: string
  /** 项目名称（覆盖自动检测） */
  projectName?: string
  /** 跳过基础设施开通 */
  skipProvision?: boolean
  /** 跳过构建 */
  skipBuild?: boolean
}

/**
 * 执行部署命令
 *
 * @param options - 部署选项
 */
export async function deployCommand(options: DeployCommandOptions): Promise<void> {
  const spinner = ora()
  const cwd = options.cwd ?? process.cwd()
  const appDir = resolve(cwd, options.appDir ?? '.')
  let closeDeploy: (() => Promise<void>) | null = null

  try {
    // 动态导入 @h-ai/deploy（允许 CLI 在未安装 deploy 时仍可使用其他命令）
    let deployModule: typeof import('@h-ai/deploy')
    try {
      deployModule = await import('@h-ai/deploy')
    }
    catch {
      core.logger.error(chalk.red(cliM('cli_deploy_module_missing')))
      core.logger.info(chalk.cyan('  pnpm add @h-ai/deploy'))
      throw new Error(cliM('cli_deploy_module_missing'))
    }

    const { deploy } = deployModule

    // 1. 加载凭证
    spinner.start(cliM('cli_deploy_load_credentials'))
    const credResult = deploy.credentials.load()
    if (!credResult.success) {
      throw new Error(cliM('cli_deploy_credentials_failed', { params: { message: credResult.error.message } }))
    }
    spinner.succeed(cliM('cli_deploy_credentials_loaded', { params: { count: credResult.data.length } }))

    // 2. 读取部署配置
    spinner.start(cliM('cli_deploy_load_config'))
    const configPath = resolve(appDir, 'config', '_deploy.yml')
    if (!existsSync(configPath)) {
      spinner.fail(chalk.red(cliM('cli_deploy_config_missing', { params: { path: configPath } })))
      core.logger.info(chalk.cyan(cliM('cli_deploy_config_hint')))
      throw new Error(cliM('cli_deploy_config_missing', { params: { path: configPath } }))
    }

    const configContent = readFileSync(configPath, 'utf-8')
    const rawConfig = interpolateEnvFallback(configContent)
    const deployConfig = parse(rawConfig)
    spinner.succeed(cliM('cli_deploy_config_loaded'))

    // 3. 扫描应用
    spinner.start(cliM('cli_deploy_scanning'))
    const scanResult = await deploy.scan(appDir)
    if (!scanResult.success) {
      throw new Error(cliM('cli_deploy_scan_failed', { params: { message: scanResult.error.message } }))
    }
    const scan = scanResult.data
    spinner.succeed(cliM('cli_deploy_scanned', { params: { name: scan.appName, sveltekit: String(scan.isSvelteKit), services: scan.requiredServices.join(', ') || cliM('cli_deploy_none') } }))

    // 4. 初始化 deploy 模块
    spinner.start(cliM('cli_deploy_initializing'))
    const initResult = await deploy.init(deployConfig)
    if (!initResult.success) {
      throw new Error(cliM('cli_deploy_init_failed', { params: { message: initResult.error.message } }))
    }
    closeDeploy = () => deploy.close()
    spinner.succeed(cliM('cli_deploy_initialized'))

    // 5. 执行部署
    spinner.start(cliM('cli_deploy_deploying'))
    const deployResult = await deploy.deployApp(appDir, {
      projectName: options.projectName,
      skipProvision: options.skipProvision,
      skipBuild: options.skipBuild,
    })

    if (!deployResult.success) {
      if (deployResult.error.ext?.recovery) {
        core.logger.warn(deployResult.error.suggestion ?? cliM('cli_deploy_command_failed'), {
          recovery: deployResult.error.ext.recovery,
        })
      }
      throw new Error(cliM('cli_deploy_failed', { params: { message: deployResult.error.message } }))
    }

    spinner.succeed(chalk.green(cliM('cli_deploy_success')))
    core.logger.info('')
    core.logger.info(chalk.cyan(cliM('cli_deploy_url', { params: { url: deployResult.data.url } })))
    core.logger.info(chalk.gray(cliM('cli_deploy_id', { params: { id: deployResult.data.deploymentId } })))
    if (deployResult.data.envVarsSet.length > 0) {
      core.logger.info(chalk.gray(cliM('cli_deploy_env', { params: { names: deployResult.data.envVarsSet.join(', ') } })))
    }
    core.logger.info('')
  }
  catch (error) {
    spinner.fail(chalk.red(cliM('cli_deploy_command_failed')))
    core.logger.error(error instanceof Error ? error.message : String(error))
    throw error
  }
  finally {
    if (closeDeploy) {
      try {
        await closeDeploy()
      }
      catch (error) {
        core.logger.error('Failed to close deploy module', { error })
        process.exitCode = 1
      }
    }
  }
}

/**
 * 简易环境变量插值（fallback，当 core.config.interpolateEnv 不可用时）
 *
 * @param content - 包含 ${VAR:default} 的字符串
 * @returns 插值后的字符串
 */
function interpolateEnvFallback(content: string): string {
  return content.replace(/\$\{([^:}]+)(?::([^}]*))?\}/g, (_match, key: string, defaultValue?: string) => {
    return process.env[key] ?? defaultValue ?? ''
  })
}
