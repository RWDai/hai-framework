# 原生交付验收

此流程覆盖现有示例的 Windows x64 NSIS、Android 和 iOS，不扩大正式平台支持承诺。Web 构建/E2E 与原生交付分别记录；打包通过不能代替安装后的验收。

## 独立构建

`.github/workflows/native.yml` 在对应 OS 上安装锁定依赖、构建共享包，再执行 Tauri、Gradle 或 Xcode 原生构建。失败直接使 job 失败；产物和记录包含提交 SHA、平台、工作流 run ID。PR 使用不可访问的 `example.invalid`，只做编译打包；手动运行须填验收 API 的完整 HTTPS 地址。

| 平台          | 必需环境                               | 独立构建入口                                                                            | 产物                                                                |
| ------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Windows x64   | Rust MSVC、C++ Build Tools、WebView2   | `pnpm --filter desktop-app tauri:build`                                                 | `apps/desktop-app/src-tauri/target/release/bundle/nsis/*-setup.exe` |
| Android       | JDK 21、Android SDK 36、Gradle wrapper | `cap add android` → `cap sync android` → `gradlew assembleDebug`                        | `android/app/build/outputs/apk/debug/*.apk`                         |
| iOS Simulator | macOS、Xcode、Swift Package Manager    | `cap add ios --packagemanager SPM` → `cap sync ios` → `xcodebuild -sdk iphonesimulator` | `App.app`                                                           |

Windows 自定义 API 域名必须同时加入 Tauri CSP 的 `connect-src`；工作流根据构建用 `PUBLIC_API_BASE` 同步该项及应用版本。生产 mobile 使用 HTTPS；HTTP 模拟器地址需要显式调试网络策略，不能把 Web 能访问误认为设备能访问。`CAPACITOR_SERVER_URL` 仅用于前端 live reload，不是 API 地址。

Android debug APK 和 iOS Simulator `.app` 都不是正式发布签名产物。真机签名、商店发布和升级验收需对应签名身份；不得为跑通流程临时绕过签名或安全存储。

## 安装后的验收清单

下载同一个提交的产物，并启动独立验收后端，记录实际 API 域名、CORS origin、transport 配置以及设备/OS/WebView 版本。只使用测试账号；证据不得包含密码、token、密钥或个人数据。

| 步骤           | 操作与通过条件                                                                                                                                | 证据                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 安装与启动     | 干净环境安装；启动进入登录页，无白屏/崩溃；UI 静态资源从安装包加载                                                                            | 包 SHA256、安装日志、启动截图 |
| 认证与业务网络 | 注册/登录测试账号，读取当前用户，执行 `app.info`/`app.echo`；验证真实 API 域名、TLS、CORS、transport                                          | 脱敏服务端请求记录和截图      |
| 断网恢复       | 断网调用显示失败、保留输入；恢复网络后可重试，无假成功                                                                                        | 操作录像或前后截图            |
| 关闭与重启     | Windows 示例使用内存 token，重启后应重新登录；Android/iOS 安全存储可恢复未过期会话，过期 refresh token 应回到登录                             | 两次启动的会话状态记录        |
| 安全存储       | Android 使用 KeyStore 加密存储，iOS 使用 Keychain；确认插件已装载，Web localStorage/普通 Preferences 无 token；安全存储异常不能冒充持久化成功 | 原生插件日志、脱敏存储检查    |
| 退出           | 退出后再次启动仍未登录；旧账号的 token 不再被读取或刷新                                                                                       | 退出和重启截图                |
| 升级           | 使用同一应用 ID、签名身份和递增版本安装旧包再覆盖新包；重复启动、登录/会话恢复、退出、网络流程                                                | 两个版本与包 hash、升级日志   |

Windows 可在隔离目录用 NSIS `/S /D=<绝对路径>` 安装；Android 用 `adb install -r <apk>`；iOS Simulator 用 `xcrun simctl install booted <App.app>`。安装成功后仍须完成表中行为，不能只检查进程存在。发布前在目标真机重复认证、安全存储和升级验证。

## 记录格式与当前状态

每次结果记入对应审查清单的验收记录，包含日期、提交 SHA、包 SHA256、平台/工具链、真实命令与退出码、逐步骤通过/失败/未验证、证据路径。工作流明确输出 `install_launch_auth_storage_network_upgrade=UNVERIFIED`，直到有设备行为证据；没有设备或凭证时保留未验证，不用 skip 制造通过结果。

本次本机 Windows 构建结果见 [审查清单](./project-review-task-list-2026-09-07.md)。Android/iOS 工作流在本地 Windows 不能替代对应工具链与设备执行，尚未触发远端工作流。

依据：[Tauri Windows 构建](https://v2.tauri.app/distribute/windows-installer/)、[Capacitor 官方文档](https://capacitorjs.com/docs)。

## 2026-09-09 本机验收记录

- 源码基线：137d2dcc，加本项原生工作流/版本配置补丁；Windows x64、Rust 1.97 MSVC、WebView2。
- `pnpm --filter desktop-app tauri:build`：退出 0，生成 `hai-desktop_0.1.0-alpha.53_x64-setup.exe`；SHA256：`B7DC900102A676AB0B3DA4A9112CC4B6BDBD748A2588F70E07D6EF51BCD172D8`。
- NSIS `/S /D=<临时验收目录>`：退出 0；启动安装目录中的真实程序，WebView2 地址为 `http://tauri.localhost/#/login`。
- 本地 `api-service` 使用隔离的 SQLite、LanceDB 与 Storage 目录，连接 `http://localhost:3000/api/v1`，transport 开启；未调用付费 AI。
- 通过 WebView2 CDP 驱动真实 UI：注册、登录、app.info、加密 app.echo、断网失败保留输入、恢复后重试、关闭重启返回登录、再次登录和退出均通过；localStorage 无 token key。
- 同一应用 ID 在验收目录安装 alpha.15 后覆盖 alpha.53，两次安装退出 0；升级后启动、登录、Echo、退出均通过。此为本机未签名安装包升级，不能代表签名分发或商店升级。
- 本机证据：`%TEMP%/hai-native-windows-final.log`、`%TEMP%/hai-native-api.log`、仓库 `.cache/native-auth-echo.png` 与 `.cache/native-logout.png`。
- 未验证：外部 HTTPS API、Android/iOS 原生构建与设备安全存储、正式签名和商店交付；对应 OS 工作流已建立，但未触发远端执行。Windows 使用内存 token，不宣称具备安全持久化。
