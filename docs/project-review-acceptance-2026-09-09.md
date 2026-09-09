# 四视角审查修复验收（2026-09-09）

范围：原清单 26 项中的 22 项非产品经理问题已修复；DEV-02 按用户决定撤销，3 项产品经理问题保留。实现基线为 `9858b3a47e50437d64fdc1ae3fffc0a6efade3be`。每项修复均有独立提交，README、实际受影响的 skill、模板、消息和调用方同步更新。

## 本次调整

| 内容                     | 提交       | 结果                                                                                          |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| 撤销 DEV-02              | `7ccb4921` | 撤销指定的 `f430b86bc06d7c42836ee3f301d39b3ef5a666ca`，移除版本同步前置门禁                   |
| ARCH-04 配置响应上限     | `e232472d` | `ApiTaskConfig.maxResponseBytes` 为可选正安全整数，单位字节，默认 1 MiB；错误消息显示实际上限 |
| DEV-01 发布影响复查      | `137d2dcc` | 完成判定查根版本；标签指向验收源码；发布完成后独立提交版本同步，支持重跑且不覆盖后续源码      |
| DEV-07 原生交付          | `8448442d` | 独立平台打包工作流、验收规范与本机 Windows 实际运行证据                                       |
| ARCH-03 验收发现的漏调度 | `9858b3a4` | cron 匹配统一使用分钟时间点，修复非零秒启动漏掉当前分钟；Scheduler 60/60 通过                 |

## 整仓门禁

| 命令                                 | 结果                                  | 说明                                                                 |
| ------------------------------------ | ------------------------------------- | -------------------------------------------------------------------- |
| `pnpm.cmd install --frozen-lockfile` | 通过                                  | 锁文件未变更                                                         |
| `pnpm.cmd typecheck`                 | 58/58 任务通过                        | 首轮无缓存；最终串行复核 41 项命中本轮缓存                           |
| `pnpm.cmd lint`                      | 29/29 任务通过                        | 首轮无缓存；后续根 build 再次执行 lint，包含 35 份 skill 契约检查    |
| `pnpm.cmd build`                     | 54/54 任务通过                        | 18 项命中缓存；生成框架与应用产物                                    |
| `pnpm.cmd test`                      | 4129 项通过，7 项跳过；63/63 任务成功 | 含发布脚本 6 项；最终 35 项任务命中本轮已通过缓存                    |
| `pnpm.cmd e2e`                       | 运行中                                | CLI 六类真实脚手架及 Admin、AI Playground、Corporate、H5、Mobile Web |

单元测试的 7 项跳过：CLI 的 6 项真实脚手架测试由根 E2E 独立启用；另 1 项 AI 音频烟测未配置外部服务。本轮没有以其他日期的结果替代验收。

## 执行中发现的问题与复核

- 首轮根测试中，Scheduler 多进程测试发现非零秒启动漏调度，已修复并单独提交，随后 Scheduler 60/60 与最终根测试通过。
- Windows Podman 命名管道在 LDAP 容器 exec 已完成后未结束返回流，导致 LDAP 初始化超时；种子数据与直接 LDAP 连接均正常。改用本机 TCP 容器连接后，LDAP 20/20、IAM 410/410 与根测试通过，未修改 LDAP 业务代码或放宽断言。
- 并行门禁共享 `dist` 曾造成桌面类型检查短暂缺少 Crypto 声明；改为串行复核后 58/58 通过。最终复核不保留这一执行冲突。

本机容器使用 Podman；验收连接为 `DOCKER_HOST=tcp://127.0.0.1:23755`，`TESTCONTAINERS_RYUK_DISABLED=true`。服务通过 `podman machine ssh -- podman system service --time=0 tcp:127.0.0.1:23755` 启动，只绑定本机回环地址。SQLite、PostgreSQL、MySQL、Redis、对象存储、向量数据库和 LDAP 的集成场景按测试实际执行。

## 原生与外部服务边界

Windows NSIS 构建、静默安装、真实 WebView2 中的注册/登录、加密 Echo、断网恢复、关闭重启、退出和覆盖升级通过。包 SHA256、操作记录和截图位置见 [原生验收记录](./native-delivery-acceptance.md)。

未验证 Android/iOS 原生构建与设备安全存储、外部 HTTPS API、正式签名和商店交付；未触发远端原生工作流，未向 npm/GitHub 实际发布，未创建真实云资源或调用付费 AI。模拟服务测试、Web E2E 与本机 Windows 证据分别记录。

## 本机日志

最终结果日志位于 `%TEMP%`：`hai-final-typecheck-serial.log`、`hai-final-build.log`、`hai-final-test-tcp.log`、`hai-final-e2e.log`。首轮问题记录保留在 `hai-final-test.log`、`hai-final-test-rerun.log` 和 `hai-final-typecheck-rerun.log`。日志为本机临时证据，不作为发布产物。
