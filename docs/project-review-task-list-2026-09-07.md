# 项目四视角审查任务清单（2026-09-07）

本轮整理 **26 项待办：产品经理 3 项、技术架构师 8 项、使用人员 8 项、开发者 7 项；P1 15 项、P2 11 项**。核心问题集中在加密组件行为、业务失败反馈、调度可靠性、云部署配置与发布完整性。

2026-09-08 起按用户要求修复非产品经理视角问题；勾选表示已完成该项实现及定向验证，提交通过任务编号追踪。产品经理视角保持待办。清单不是全项目无遗漏的安全认证；通过现有测试也不代表这些问题已解决。

## 1. 范围、证据与排期口径

- 基准：`main`，提交 `b21734603da34fbbca4448c536e487bed4f7e542`，版本 `0.1.0-alpha.53`。审查开始时工作区干净。
- 覆盖：根 README、模块与应用索引、仓库规范、CI/发布/构建配置；重点追踪 UI 加密、Admin IAM、官网联系表单、Scheduler、Deploy、CLI 的实现、调用方、配置和测试。移动/桌面端核对了文档、构建入口与验收范围，未穷尽其他模块每个方法。
- 方法：使用仓库 `hai-review-module` 技能。按本次“审查并生成任务清单”的要求，仅记录问题，不执行技能中建议的即时修复。
- 历史去重：复核 [上次审查报告](./module-review-2026-08-30.md)，不重复列入已修复的 A2A/MCP/Cache/CLI 生成器问题。其 LDAP 环境阻塞及其他未验证项保留为历史信息，不冒充本轮复测结果。
- 使用人员包括框架接入者、后台管理员和示例应用终端用户；负责人均为建议角色，尚未分派给具体人员。
- **实测**：本轮执行公共 API 或工具验证；**源函数实测**：从源码提取原函数执行，不等同于浏览器组件测试；**静态确认**：实现与调用链能直接说明问题，尚未跑完整运行场景；**验收缺口/产品改进**：补齐决策或验证依据，不冒充已发生的线上故障。
- **P1**：影响结果真实性、敏感信息保护、任务执行可靠性或发布完整性，应在相关能力继续推广/发布前处理。**P2**：影响接入、运维、可理解性或验收覆盖，应进入近期迭代。本轮未以现有证据认定 P0。
- 工作量为初步工程估算：S＝约 0.5–1 人日；M＝约 2–3 人日；L＝约 4–7 人日。包含定向回归，不包含等待外部账号、原生设备和云资源的时间。

新增文档必要性与影响：Q1 复用已有审查报告结构；Q2 旧报告是已完成修复记录，新增日期文件保留历史状态；Q3 对应本次明确需求；Q4 只新增一个 Markdown；Q5 不增加使用方内部知识要求；Q6 遵循 `docs/` 现有组织；Q7 每项附证据和验收，避免无依据扩张。无运行时代码、公共类型、错误码、依赖、README 或 skill 行为变更。

## 2. 产品经理视角：能力承诺与采用决策

### PM-01｜P2｜建立可用于选型的能力与验证矩阵

- [ ] **任务**：在主文档中集中标注模块/应用/Provider 的支持范围、实测环境、限制、验证日期与证据入口。
- **证据与影响〔产品改进〕**：[README](../README.md) 的模块总览按“支持”展示；实际运行边界分散在模块 README、桌面示例范围和上次审查报告中。现有 alpha 提示有价值，但接入者仍难以区分“实现存在”“确定性测试通过”“外部服务验收完成”。
- **验收**：从主 README 可直接查到 AI 外部服务、数据库后端、云部署、脚手架类型、Web/Android/iOS/Tauri 的证据等级；未验证明确写未验证，不用统一勾选代表同等成熟度。
- **建议负责人/工作量/依赖**：产品负责人＋QA / M / 汇总现有记录，与 DEV-07 联动。

### PM-02｜P1｜让 alpha 版本的发布标识与产品定位一致

- [ ] **任务**：按版本阶段明确 GitHub Release 的 prerelease 标识和 npm 发布渠道，并在安装文档中说明稳定版与预发布版入口。
- **证据与影响〔静态确认〕**：[根版本与定位](../package.json) 为 `0.1.0-alpha.53`；[CI](../.github/workflows/ci.yml) 第 224 行固定 `prerelease: false`，第 257 行发布命令未显式指定预发布渠道。发布元数据没有体现 README 声明的 alpha 阶段。
- **验收**：alpha/beta/rc 与稳定版本的发布分支分别验证；预发布不会被标为正式 Release；使用方能明确选择渠道。通过本地流程测试验证，不为测试实际发布包。
- **建议负责人/工作量/依赖**：产品负责人＋发布维护者 / S / 与 DEV-01、DEV-02 一起调整发布流程。

### PM-03｜P2｜把已知破坏性变更整理成升级指南

- [ ] **任务**：提供按版本组织的升级步骤、配置变更、数据迁移前提和回退边界，主 README 增加入口。
- **证据与影响〔产品改进〕**：[上次报告](./module-review-2026-08-30.md) 明确涉及 A2A 旧任务归属迁移和默认发现地址变化；[README](../README.md) 主要提供新接入示例，未给出相应的用户升级流程。修复记录不等于可执行升级指南。
- **验收**：至少包含这些已知变更的旧/新调用示例、存量数据处置、升级验证与失败回退；旧任务归属不明时要求业务审核，不自动推断归属。
- **建议负责人/工作量/依赖**：产品负责人＋模块维护者 / M / 引用 PM-01 的验证边界。

## 3. 技术架构师视角：模块协作与运行可靠性

### ARCH-01｜P1｜打通云资源开通结果与应用配置的真实消费链

- [ ] **任务**：对齐 Deploy 输出的环境变量、CLI 配置模板和 Core/RelDB/Cache/Storage/Reach 实际接入能力。
- **证据与影响〔静态确认〕**：[Neon](../packages/deploy/src/provisioners/deploy-provisioner-neon.ts) 第 105 行输出 `HAI_RELDB_URL`；[应用初始化](../apps/admin-console/src/lib/server/init.ts) 第 102 行读取 `db` 配置，[Core 环境变量映射](../packages/core/src/functions/core-function-config.node.ts) 第 84 行按配置名与叶子路径生成变量名。[Upstash](../packages/deploy/src/provisioners/deploy-provisioner-upstash.ts) 输出 REST URL/token，但 [Cache Schema](../packages/cache/src/cache-config.ts) 仅支持 memory/Redis 连接配置；[R2](../packages/deploy/src/provisioners/deploy-provisioner-r2.ts) 输出 `HAI_STORAGE_S3_*`，而应用使用扁平 Storage 配置。全局检索这些输出变量仅发现 provisioner 与其测试，没有实际应用消费链；默认 SQLite/memory/local 也未随开通结果切换。
- **验收**：将模拟开通结果注入一个真实 CLI 生成应用，通过 Core 读取并验证最终连接配置；再在具备条件时完成云端写入/读取验收。优先复用已有 Redis/S3/邮件能力，无法适配的渠道明确限制。禁止仅断言返回字符串就认定部署集成成功。
- **建议负责人/工作量/依赖**：Deploy＋Core/CLI 维护者 / L / PM-01 更新支持边界。

### ARCH-02｜P2｜为部分成功的基础设施开通提供恢复信息

- [ ] **任务**：部署失败时保留已开通资源、失败步骤、新建/复用状态，并提供安全重试与人工清理指引。
- **证据与影响〔静态确认〕**：[deploy-main.ts](../packages/deploy/src/deploy-main.ts) 第 266 行 `provisionAll()` 顺序开通，后续失败直接返回该错误，局部 `results` 不返回；`deployApp()` 先开通再创建项目、设置变量和构建，后续任一步都可失败。[资源结果类型](../packages/deploy/src/deploy-types.ts) 有 `resourceInfo`，但失败返回没有携带成功清单。现有同名资源复用不能替代失败恢复报告。
- **验收**：模拟“数据库成功、缓存失败”和“资源开通成功、构建失败”，调用方能准确识别已有资源及恢复步骤；复用资源不被自动删除，重试不无提示地重复创建。
- **建议负责人/工作量/依赖**：Deploy 维护者 / M / ARCH-01。

### ARCH-03｜P1｜解决调度任务定义在多节点间失效不同步

- [x] **任务**：使启用持久化的调度节点能够获知任务注册、修改、禁用和删除；明确刷新延迟与执行前校验策略。
- **证据与影响〔静态确认〕**：[scheduler-functions.ts](../packages/scheduler/src/scheduler-functions.ts) 第 28 行保存进程内任务 Map，`loadPersistedTasks()` 只在 [init](../packages/scheduler/src/scheduler-main.ts) 第 108 行加载；[tick](../packages/scheduler/src/scheduler-runner.ts) 第 106 行直接遍历本地注册表。当前锁只协调同一分钟的任务竞争，不能同步任务定义。在 A 节点禁用/删除的任务仍可能被 B 节点按旧定义执行。
- **验收**：两个真实进程共享数据库与 Redis，分别验证注册、改参数、禁用、删除、一次性任务删除；另一节点在约定时间内收敛，禁用后的过期定义不能继续产生业务执行。
- **建议负责人/工作量/依赖**：Scheduler＋数据层维护者 / L / 先明确产品允许的刷新延迟。

### ARCH-04｜P1｜让 HTTP 任务超时覆盖响应体读取

- [x] **任务**：保持超时控制直至响应体消费完成，结束时统一释放定时器；明确响应大小上限。
- **证据与影响〔实测〕**：[scheduler-executor.ts](../packages/scheduler/src/scheduler-executor.ts) 第 234 行在 `response.text()` 之前清除定时器。配置 30ms，本地服务立即返回响应头、160ms 后完成 body，任务约 174ms 后仍记为成功。无限流式响应可让执行长期占用资源。
- **验收**：响应头快/body 慢、body 不结束、请求错误、正常响应均覆盖；超时能中止读取并返回失败，任务占用与定时器被释放。
- **建议负责人/工作量/依赖**：Scheduler 维护者 / S / 回归 `retry` 行为。

### ARCH-05｜P1｜修正 JS 任务的执行时限与重试语义

- [x] **任务**：明确同步执行与异步等待的超时边界；需要强制终止时使用可终止执行环境，并避免旧执行与重试同时产生副作用。
- **证据与影响〔实测＋静态确认〕**：[scheduler-js-compiler.ts](../packages/scheduler/src/scheduler-js-compiler.ts) 第 49 行先调用函数，之后才创建超时定时器。10ms 配置下，80ms 有界同步循环约 81ms 后仍成功。异步超时当前仅 reject 等待 Promise，没有停止原任务，随后重试可能与原执行重叠。这里审查的是执行时限，不把已注明“非安全沙箱”的设计重复报为沙箱漏洞。
- **验收**：有界同步超时、异步超时后迟到结果、失败重试均有验证；超时不能被记为正常成功，旧执行产生副作用的边界清晰且受控。死循环测试必须在可终止子进程中执行。
- **建议负责人/工作量/依赖**：Scheduler 维护者 / L / 与 ARCH-06 统一取消机制。

### ARCH-06｜P1｜关闭调度器时处理在途任务和重试等待

- [x] **任务**：定义并实现关闭期间的等待/取消策略，隔离旧实例的完成回调、日志和注册表变更。
- **证据与影响〔实测〕**：[scheduler-main.ts](../packages/scheduler/src/scheduler-main.ts) 第 263 行 `close()` 立即清空状态，不等待 `runTask()`；[runner](../packages/scheduler/src/scheduler-runner.ts) 仍可继续执行或重试。本轮保持一个 hook 任务等待，`close()` 返回且 `isInitialized=false` 后，释放 hook，该任务仍返回成功。若随后关闭 DB/cache 或重新初始化，同一在途执行会面对已变更的依赖和全局状态。
- **验收**：覆盖执行中关闭、重试退避中关闭、关闭后立即 init；旧任务不写入新实例状态，依赖关闭顺序明确，关闭时间有界。
- **建议负责人/工作量/依赖**：Scheduler 维护者 / M / ARCH-05。

### ARCH-07｜P1｜初始化任务加载失败时返回可判定结果

- [x] **任务**：把配置任务非法、持久化读取失败、部分任务加载失败传给初始化调用者，避免“启动成功但没加载业务任务”。
- **证据与影响〔实测＋静态确认〕**：[scheduler-functions.ts](../packages/scheduler/src/scheduler-functions.ts) 第 129/155 行加载失败只记 warn，返回 `void`；[main](../packages/scheduler/src/scheduler-main.ts) 继续返回 `ok`。本轮 `tasks` 含非法 cron 时，`init.success=true`、`tasks.size=0`。
- **验收**：非法 cron、空任务 ID、DB 查询失败、部分任务失败均覆盖；默认阻止不完整启动，若支持显式部分加载模式，则失败清单必须结构化且调用方可见。
- **建议负责人/工作量/依赖**：Scheduler 维护者 / M / 同步 README 和 CLI Scheduler skill。

### ARCH-08｜P1｜让角色权限替换具有完整成功或失败的语义

- [ ] **任务**：权限查询失败先停止写入；权限增删与角色更新使用统一事务或可验证的原子替换能力。
- **证据与影响〔静态确认〕**：[iam-admin.ts](../apps/admin-console/src/lib/server/iam-admin.ts) 第 133 行 `syncRolePermissionIds()` 把旧权限查询失败当空集合，再 `Promise.all` 并发增删；第 214 行更新角色信息后才同步权限。任何一个操作失败都可能留下部分更新；“撤销权限”未完整执行尤其难以察觉。
- **验收**：旧权限读取失败时零写入；中途增删失败时恢复原权限集合和角色信息；并发编辑有冲突处理。覆盖服务端真实事务与权限缓存失效，不只 mock API 返回。
- **建议负责人/工作量/依赖**：IAM＋Admin 维护者 / M / 与 USER-06 分开处理“写一致性”和“读失败呈现”。

## 4. 使用人员视角：结果真实、操作可恢复

### USER-01｜P1｜联系表单未送达时不得显示成功并清空输入

- [x] **任务**：让前端消费真实 `sent` 状态，送达失败时保留输入并提供重试/替代联系方法。
- **证据与影响〔静态确认〕**：[contact API](../apps/corporate-website/src/routes/api/contact/+server.ts) 在 Reach 未配置、收件人缺失或发送失败时返回 `kit.response.ok({ sent: false })`；[联系页](../apps/corporate-website/src/routes/contact/+page.svelte) 第 27 行只判断 `data.success`，随后提示成功并清空三个字段。接口也未持久化这些未发送内容，潜在客户会误以为消息已经送达。
- **验收**：真实浏览器覆盖未配置、发送失败、成功三条路径；失败无成功提示且保留表单，成功才清空；现有 [官网 E2E](../apps/corporate-website/e2e/pages-and-partner.spec.ts) 仅访问联系页标题，需要补真实提交断言。
- **建议负责人/工作量/依赖**：官网前后端维护者 / S / 无。

### USER-02｜P1｜移除加密输入组件的 Base64 默认“加密”

- [x] **任务**：无加密回调时明确不可用，或接入真实加密能力；不得把编码结果标注为 SM2/SM4 密文。
- **证据与影响〔源函数实测〕**：[EncryptedInput.svelte](../packages/ui/src/lib/components/scenes/crypto/EncryptedInput.svelte) 第 61 行以 `btoa(text)` 回退，界面却按 `algorithm` 显示算法标签。`secret` 得到可直接逆转的 `c2VjcmV0`；中文输入抛 `InvalidCharacterError`。[Gallery](../apps/admin-console/src/routes/admin/ui-gallery/scenes/+page.svelte) 第 816 行直接描述为“SM4 对称加密”且未传回调；[UI README](../packages/ui/README.md) 列为加密输入。
- **验收**：默认路径不产生伪密文；真实算法可验证解密还原，中文与 emoji 不抛未处理异常；组件、Gallery、README 与相关 skill 对能力边界描述一致。
- **建议负责人/工作量/依赖**：UI＋Crypto 维护者 / M / USER-07 同步纠正演示。

### USER-03｜P1｜加密输入不得被旧异步结果覆盖

- [x] **任务**：对输入变化、清空、失败和卸载失效旧请求，只有当前输入对应的成功结果可以更新密文。
- **证据与影响〔源函数实测〕**：[EncryptedInput.svelte](../packages/ui/src/lib/components/scenes/crypto/EncryptedInput.svelte) 第 70 行直接 `onencrypt(value).then(...)`，没有序号、失效检查和 rejection 处理。先输入 first 再输入 second，让第二次先完成、第一次后完成，最终 `value=second` 而 `encryptedValue=cipher-first`。清空后也存在旧结果回填路径。
- **验收**：逆序返回、输入清空、回调拒绝、卸载后返回均覆盖；提交不能携带旧输入的密文，失败状态对使用者可见。
- **建议负责人/工作量/依赖**：UI 维护者 / M / USER-02。

### USER-04｜P2｜角色用户数展示真实统计或明确未知

- [ ] **任务**：接入按角色聚合的用户计数；能力未就绪时展示未知/未提供，不能填 0。
- **证据与影响〔静态确认〕**：[iam-admin.ts](../apps/admin-console/src/lib/server/iam-admin.ts) 第 263 行 `getAdminRoleUserCount()` 固定返回 0；[角色页 loader](../apps/admin-console/src/routes/admin/iam/roles/+page.server.ts) 将其作为真实 `userCount`，[CRUD 定义](../apps/admin-console/src/lib/crud/admin-crud.ts) 第 207 行展示该列。管理员无法据此判断角色使用情况。
- **验收**：无用户、一个用户、多个用户以及查询失败的状态可区分；数量来自批量聚合，避免逐角色查库。
- **建议负责人/工作量/依赖**：Admin＋IAM 维护者 / M / 无。

### USER-05｜P2｜中文角色名称不能生成相同角色代码

- [x] **任务**：把展示名称和唯一标识分开，复用已有 ID/唯一性能力；保留现有角色代码的稳定性。
- **证据与影响〔源函数实测〕**：[创建角色 Schema](../apps/admin-console/src/lib/server/schemas/iam-schemas.ts) 第 95 行允许中文名称；[创建 API](../apps/admin-console/src/routes/api/iam/roles/+server.ts) 调用 [createRoleCode](../apps/admin-console/src/lib/server/iam-admin.ts) 第 152 行，移除非 ASCII 字符。本轮“管理员”“审核员”“运营”全部得到 `role_`，第二个不同中文角色会撞同一唯一代码。
- **验收**：多个不同中文名称、emoji、纯符号、相近英文名称可按明确规则创建；禁止新规则悄悄改写已有角色引用。
- **建议负责人/工作量/依赖**：Admin 维护者 / S / 无。

### USER-06｜P1｜查询失败不能伪装为空列表、零统计或空权限

- [ ] **任务**：保留并显示数据读取错误，阻止在权限数据不完整时进入可保存的编辑状态。
- **证据与影响〔静态确认〕**：[iam-admin.ts](../apps/admin-console/src/lib/server/iam-admin.ts) 第 104 行分页失败返回空数组，部分分页失败被丢弃；第 196/208 行权限查询失败变为空权限，第 294 行权限列表失败返回 `total:0`。[仪表盘 loader](../apps/admin-console/src/routes/admin/+page.server.ts) 第 23 行将失败统计填为 0。用户看到的是正常空数据，可能据此作出错误管理操作。
- **验收**：断库、单页失败、权限查询失败时显示可重试错误；确实无数据才显示空态；加载不完整不能提交权限替换；总数不由错误默认值伪造。
- **建议负责人/工作量/依赖**：Admin 前后端维护者 / M / 与 ARCH-08 联动。

### USER-07｜P2｜加密演示不得用随机值表示算法执行成功

- [ ] **任务**：演示按钮接入现有 Crypto API，或显著标成不可作为运算结果的模拟展示。
- **证据与影响〔静态确认〕**：[模块演示页](../apps/admin-console/src/routes/admin/modules/+page.svelte) 第 94 行 `mockHash()` 随机生成 64 位字符，第 104 行 `mockEncrypt()` 用 Base64 拼接随机后缀，两者都显示完成提示。输入不变时“哈希”仍变化，使用者无法用该页面验证真实算法。
- **验收**：真实哈希同输入同结果，真实加密可解密；若保留模拟，按钮、结果和提示统一说明模拟。复用框架现有能力，不增加独立算法实现。
- **建议负责人/工作量/依赖**：Admin＋Crypto 维护者 / S / USER-02。

### USER-08｜P2｜失败与降级文案也应跟随语言选择

- [ ] **任务**：补齐官网 AI 降级响应、联系接口提示和 CLI 部署提示的 i18n；核对 Gallery 页面说明。
- **证据与影响〔静态确认〕**：[官网 chat API](../apps/corporate-website/src/routes/api/chat/+server.ts) 第 26 行及失败分支固定中文回复；[contact API](../apps/corporate-website/src/routes/api/contact/+server.ts) 的状态消息固定英文；[cli-deploy.ts](../packages/cli/src/commands/cli-deploy.ts) 大量固定英文状态与错误。界面切换语言后，最需要理解的失败提示仍可能混用语言。桌面示例已明确不包含 i18n，本任务不把该已声明范围自动扩大为桌面功能开发。
- **验收**：中英文分别验证未配置、网络失败、操作成功；新增 key 成对更新；不要求真实外部服务才能验证降级提示。
- **建议负责人/工作量/依赖**：官网＋CLI＋UI 维护者 / M / USER-01。

## 5. 开发者视角：可复现构建与可信发布

### DEV-01｜P1｜修复发布部分失败后的重试阻断

- [ ] **任务**：将版本 tag、Release 和所有公共包发布完成区分为独立状态，允许同版本补齐缺失包。
- **证据与影响〔静态确认〕**：[CI](../.github/workflows/ci.yml) 第 207 行先创建 tag，第 217 行创建 Release，之后才做 npm 认证与发布；第 41 行又以 tag 已存在直接跳过整个 release。若首次只发布部分包，重新跑全部工作流会因 tag 存在而跳过补发。已有逐包 `npm view` 跳过逻辑因此不一定能被执行；单独重跑失败 job 是否可用不应成为唯一恢复路径。
- **验收**：模拟第 N 个包失败和认证失败；完整重跑、失败 job 重跑都能补齐同版本，已发布包不覆盖，全部发布完成后才呈现完成状态。
- **建议负责人/工作量/依赖**：发布维护者 / M / PM-02。

### DEV-02｜P2｜版本同步应发生在发布验证之前

- [ ] **任务**：在质量门禁之前完成版本/模板同步，或验证同步无变更；发布打包对象与验证对象保持一致。
- **证据与影响〔静态确认〕**：[CI](../.github/workflows/ci.yml) 第 129 行恢复已验证产物后，第 132 行运行 [sync-versions.mjs](../scripts/sync-versions.mjs)，该脚本会修改 packages/apps manifest 与 CLI 模板并提交；之后没有重新执行生成项目门禁。当维护者只更新根版本时，测试通过的模板与最终分发模板不是同一份。
- **验收**：仅修改根版本的场景能正确同步并在验证前完成；记录验证提交及包清单，最终 tarball 中的 manifest、模板、依赖版本与已验证结果相符。
- **建议负责人/工作量/依赖**：发布＋CLI 维护者 / M / DEV-01。

### DEV-03｜P1｜CLI 部署失败必须返回失败退出码

- [x] **任务**：统一命令失败结果，让缺少模块、缺少配置、初始化失败和部署失败均以非零退出码结束。
- **证据与影响〔静态确认〕**：[cli-deploy.ts](../packages/cli/src/commands/cli-deploy.ts) 第 47、68、89、105 行等分支只打印错误并 `return`；[cli-main.ts](../packages/cli/src/cli-main.ts) 第 146 行只在 catch 中 `process.exit(1)`。这些正常返回的失败分支会被自动化调用方当作成功。
- **验收**：以真实 CLI 子进程覆盖上述分支并断言非零；成功路径退出 0；不只断言屏幕包含失败文字。使用隔离配置和本地模拟，禁止为此实际部署。
- **建议负责人/工作量/依赖**：CLI 维护者 / S / USER-08 同步错误消息。

### DEV-04｜P2｜统一运行时版本要求与快速开始

- [ ] **任务**：明确仓库开发、发布包运行、生成项目三种场景的 Node/pnpm 支持范围，并同步 README、engines、模板与 CI。
- **证据与影响〔静态确认〕**：[Admin README](../apps/admin-console/README.md) 第 21 行要求 Node ≥20；[根 package.json](../package.json) 要求 ≥22，[CI](../.github/workflows/ci.yml) 只运行 Node 22，[共享 tsup](../packages/tsup.base.ts) 则设置 `target: node20`。这些层面的版本要求未解释区分，按应用说明准备环境不能保证满足仓库安装要求。
- **验收**：文档给出同一支持矩阵；最低支持版本完成安装和最小启动；不以编译 target 推导全部运行时兼容性，不无依据扩大版本支持。
- **建议负责人/工作量/依赖**：开发工具维护者＋文档维护者 / S / PM-01。

### DEV-05｜P2｜本地发布验收应与 CI 的 E2E 范围一致

- [ ] **任务**：复用同一发布验收入口，或给明确缩减范围的本地命令使用清晰名称。
- **证据与影响〔静态确认〕**：[根 package.json](../package.json) 第 20 行 `test:release-local` 只跑 Admin E2E；[CI](../.github/workflows/ci.yml) 的 `pnpm e2e` 则包含 CLI 真实脚手架和多个应用。本地发布验收成功不等于跑过 CI 同范围的发布门禁。
- **验收**：命令输出列出实际覆盖范围；完整本地发布入口覆盖与 CI 相同的 E2E 集合；快速入口可保留但名称/文档明确边界。仓库已有 `shellEmulator: true`，不把 `CI=true` 写法直接误报为 Windows 缺陷。
- **建议负责人/工作量/依赖**：开发工具＋QA / S / DEV-02。

### DEV-06｜P1｜构建缓存应区分实际影响产物的环境变量

- [ ] **任务**：把构建变量加入 Turbo 的环境传递与缓存输入，核对客户端环境变量的框架自动推断范围。
- **证据与影响〔实测〕**：[packages/tsup.base.ts](../packages/tsup.base.ts) 第 12 行通过 `HAI_DOCKER_PROD_BUILD` 控制声明文件和 sourcemap；[turbo.json](../turbo.json) 未配置相应 `env`。本轮针对 Scheduler build 分别设置 false/true 执行 `turbo --dry=json`，两次 hash 均为 `15eb9662fcf6ec4d`，specified/configured/inferred 环境列表均为空。不同预期产物没有形成不同缓存键，在严格环境过滤下变量本身也没有声明传入。
- **验收**：开发/容器构建分别验证变量传递、不同缓存 hash 和实际声明文件/sourcemap；同配置能命中缓存。客户端 `PUBLIC_*` 逐应用核对实际自动推断结果，不一概断言所有前缀都失效。
- **建议负责人/工作量/依赖**：构建维护者 / M / DEV-02。

### DEV-07｜P2｜补齐原生端交付验收，避免 Web 构建替代原生验收

- [ ] **任务**：为计划支持的原生端制定独立打包、启动、认证/存储、网络与升级验证流程，并保存可复查结果。
- **证据与影响〔验收缺口〕**：[Desktop package](../apps/desktop-app/package.json) 的 `build` 仅执行 Vite，原生打包另有 `tauri:build`；[Mobile package](../apps/mobile-app/package.json) 也将 Web 构建和 Capacitor 命令分开。[CI](../.github/workflows/ci.yml) 只有 Ubuntu Node 质量任务，没有原生交付矩阵；[Desktop README](../apps/desktop-app/README.md) 明确不含 E2E。当前门禁不能证明原生安装包可用，不等同于已经证明原生功能损坏。
- **验收**：先确定正式支持平台；在对应 OS/工具链上验证安装包启动、登录、退出、重启后的约定会话行为及实际 API 域名访问；Android/iOS 验证安全 TokenStore。缺少平台时标明未验证，不通过跳过测试制造绿灯。
- **建议负责人/工作量/依赖**：客户端维护者＋QA / L / PM-01，受设备/平台条件约束。

## 6. 建议实施顺序与任务边界

| 批次                          | 任务                        | 交付结果                                                                     |
| ----------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| 1：纠正错误结果和敏感组件行为 | USER-01/02/03/06、ARCH-08   | 联系表单送达状态真实；密文与当前输入对应；权限读写失败可见且不产生半完成状态 |
| 2：保证发布可恢复且产物可信   | PM-02、DEV-01/02/03/06      | 预发布渠道清楚；发布可补齐；失败退出码可靠；缓存对应真实构建配置             |
| 3：调度与云部署               | ARCH-01/02/03/04/05/06/07   | 配置消费链打通；任务状态、时限、关闭及启动失败具有明确契约                   |
| 4：接入与使用体验             | USER-04/05/07/08、DEV-04/05 | 管理数据真实、中文名称可用、语言与运行要求一致、验收命令范围清楚             |
| 5：支持边界与采用文档         | PM-01/03、DEV-07            | 能力矩阵、升级流程与原生验收证据可供采用决策                                 |

每项修复都应同步实际受影响的实现、测试、README、仓库 skill/CLI skill 副本、中英文消息和依赖调用方。涉及公共契约再检索 LLMS.txt 与生成模板；不要求无关文件机械同步。同一缺陷的测试补充属于该缺陷验收，不另拆任务凑数量。

## 7. 本轮验证记录与未执行项

| 检查                                                 | 本轮结果                                              | 证据边界                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm.cmd typecheck`                                 | 通过，42/42 任务，16 项缓存命中                       | 不能替代业务行为验证                                                           |
| `pnpm.cmd lint`                                      | 通过，29/29 任务，25 项缓存命中，含 skill 契约检查    | 新增报告另做定向 lint；任务编号与文件链接已核对                                |
| `pnpm.cmd --filter @h-ai/scheduler test`             | 通过，4 文件、46/46 测试                              | 现有测试未覆盖本轮复现的全部边界                                               |
| `pnpm.cmd --filter @h-ai/scheduler build`            | 通过，ESM 和 DTS 产物生成                             | 为确保公共 API 复现使用当前源码产物而执行                                      |
| Scheduler 公共 API 临时复现                          | 4 个问题现象均观察到                                  | 禁用数据库；HTTP 仅访问本机随机端口，无外部服务                                |
| UI/角色命名源函数提取执行                            | Base64 可逆、中文异常、异步乱序、中文代码碰撞均观察到 | 未挂载真实浏览器 Svelte 组件                                                   |
| Turbo 两组 dry-run                                   | 构建环境开关变化，hash 相同                           | 证明缓存键/环境声明缺口；未冒充两次真实容器构建                                |
| 根 `pnpm build`                                      | 未执行                                                | 本轮只新增审查文档，无跨包实现修改；仅构建用于复现的 Scheduler                 |
| 根 `pnpm test`                                       | 未执行                                                | 未改运行时代码，本轮使用针对性验证；不复用上次全量结果冒充当前通过             |
| 根 E2E、浏览器交互、六类完整脚手架                   | 未执行                                                | 本轮没有实施 UI/路由修复；使用流程问题来自调用链确认，后续修复须按各项验收执行 |
| 云资源、支付、付费 AI、MCP 网络互操作、容器/原生打包 | 未执行                                                | 本轮未调用外部付费服务或创建云资源，未获得这些面的新验收证据                   |

临时复现脚本和命令日志位于本机临时目录，未加入仓库；关键输入、输出和源码定位已写入对应任务，脚本不访问真实凭证或业务数据。时间值仅是本轮观测，不应被固化为脆弱的精确耗时断言。

**修复状态**：以下按问题记录实现与验证；最终全量验收另行记录，历史审查证据不等于修复后的验收。

- **USER-01**：联系表单严格检查 sent，未送达保留输入；应用 check 通过，真实 Chrome 失败保留/成功清空 E2E 1/1 通过。已同步官网 README 与两份应用审查 skill。

- **USER-02**：删除 Base64 回退并显示未配置状态，Gallery/README/两份 UI skill 同步；UI check、build、全量 275/275 测试通过，含真实组件中文输入回归。

- **USER-03**：按输入/回调/生命周期失效异步请求，输入即清空密文，拒绝显示双语错误；真实组件逆序、清空、失败、卸载测试通过，UI check/build 通过；README 与两份 skill 已同步。

- **USER-05**：角色 code 改用 core.id.generate，移除名称清洗函数；同步应用 README、仓库及 CLI IAM skill。真实 Playwright API 连续创建中文、表情、同名及大小写相近角色，全部成功且标识唯一（1/1）；预览构建通过。

- **ARCH-04**：API 超时覆盖完整响应流，按实际字节限制 1 MiB；通过本地 HTTP 服务验证响应头后停滞、超限、503 及中文表情成功响应。scheduler 47/47 测试、typecheck、build 通过，README 与 CLI scheduler skill 同步。

- **ARCH-07**：初始化加载改为 HaiResult 失败透传；无效配置、重复任务、损坏持久化数据或读取失败清空本轮状态。新增真实 SQLite 损坏表/数据与恢复测试，scheduler 52/52、typecheck 通过；README 和 CLI scheduler skill 同步。

- **ARCH-05**：JS 在可终止的独立 Worker 中执行，主线程只解析语法；默认 30 秒，到期等待线程退出后才重试。同步循环、表达式循环和永不完成 Promise 均不阻塞主线程；scheduler 55/55、typecheck、build、构建产物真实 Worker smoke 通过。README、类型注释、CLI skill 同步。

- **ARCH-06**：close 拒绝新任务，取消 HTTP、Worker 和退避等待，等待执行链退出后清理；Hook 通过事件 signal 协作取消。真实 HTTP 关闭、Worker、重试、迟到 Hook 与同 ID 重初始化隔离验证通过；scheduler 58/58、typecheck、build 通过。README、公共事件类型、CLI skill 同步。

- **ARCH-03**：按 tickInterval 刷新持久化定义，API 与获锁后的每次执行前重查，禁用/删除/改期或读取失败中断旧执行。两个真实进程共享 SQLite 与 Podman Redis 验证注册、参数更新、禁用、删除、一次性删除及同分钟仅一次成功；scheduler 59/59、typecheck、build 通过。README 和 CLI skill 明确刷新及本地配置边界。

- **DEV-03**：部署各失败分支抛给 CLI 统一入口，进程以 1 退出；保留 finally 清理并传播清理异常。部署命令及入口 16/16、CLI typecheck/build 通过；构建后的真实 CLI 缺配置退出码为 1。CLI README 与 hai-deploy skill 同步。
