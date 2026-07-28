# 服务器部署指南

从源码在 Linux 服务器上安装、配置、运行 Hermes Studio。适用于自托管场景。

## 前置条件

- **Node.js 23+**（推荐用 fnm / nvm 管理）
- **Hermes Agent（`hermes` CLI）**：agent 对话、网关等功能依赖它。
  - 已安装：确保 `hermes` 在 `PATH` 中，或用 `HERMES_BIN` 指向其路径。
  - 暂未安装：先设置 `HERMES_WEB_UI_DISABLE_GATEWAY_AUTOSTART=1`，UI 可独立启动；后续装好 hermes 再去掉该变量。
- 构建工具链：`npm install` 会装好 devDependencies，`npm run build` 需要 Vite / vue-tsc / esbuild 等，都会自动到位。

> 注意：服务端启动时默认会自启 `hermes gateway`。若机器上没有 `hermes` 且未关闭自启，启动会因 `spawn hermes ENOENT` 崩溃。

## 安装（源码）

```bash
git clone https://github.com/svefnz/hermes-studio.git
cd hermes-studio
npm install          # prepare 会自动触发 npm run build，首次构建约数分钟
```

构建产物输出到 `dist/`（`dist/client` 为前端，`dist/server/index.js` 为服务端 bundle）。

如果自动构建失败，单独重跑查看报错：

```bash
npm run build
```

想跳过所有安装脚本再手动构建（更可控）：

```bash
npm ci --ignore-scripts
npm run build
```

## 配置（环境变量）

建议集中放一个文件，例如 `/etc/hermes-studio.env`：

```bash
# 数据目录：务必显式设置，统一 CLI 与服务端
# （不设的话 CLI 默认 ~/.hermes-studio，服务端默认 ~/.hermes-web-ui，会不一致）
export HERMES_WEB_UI_HOME=/var/lib/hermes-studio

# 监听
export PORT=8648
export BIND_HOST=0.0.0.0
export LOG_LEVEL=info

# 没有 hermes CLI 时先关掉网关自启，避免启动崩溃
export HERMES_WEB_UI_DISABLE_GATEWAY_AUTOSTART=1

# 有 hermes 但不在 PATH：
# export HERMES_BIN=/path/to/hermes

# 自定义访问 token（不设则首次运行自动生成并写入 $HERMES_WEB_UI_HOME/.token）
# export AUTH_TOKEN=换成一段长随机串

# CORS（如需跨域访问）：
# export CORS_ORIGINS=https://your-frontend.example.com
```

建好数据目录：

```bash
mkdir -p /var/lib/hermes-studio
```

完整环境变量说明见 `DEVELOPMENT.md` 与 `packages/server/src/config.ts` 顶部注释。

## 运行

```bash
set -a; source /etc/hermes-studio.env; set +a

node bin/hermes-studio.mjs start        # 守护进程，启动后打印访问 URL
node bin/hermes-studio.mjs status       # 查看运行状态
node bin/hermes-studio.mjs stop         # 停止
node bin/hermes-studio.mjs restart      # 重启
tail -f "$HERMES_WEB_UI_HOME/server.log"
```

浏览器打开 `http://<服务器IP>:8648`。

也可以直接前台跑服务端（便于排错）：

```bash
node dist/server/index.js
```

## 登录

- 首次 `start` 会自动生成 token，控制台会打印带 token 的 URL。
- 想用账号密码登录，创建/重置默认账号：

```bash
node bin/hermes-studio.mjs reset-default-login   # admin / 123456
```

## 做成系统命令 + 开机自启

系统命令（软链）：

```bash
ln -s "$(pwd)/bin/hermes-studio.mjs" /usr/local/bin/hermes-studio
hermes-studio start
```

systemd 服务（生产推荐），新建 `/etc/systemd/system/hermes-studio.service`：

```ini
[Unit]
Description=Hermes Studio
After=network.target

[Service]
Type=forking
WorkingDirectory=/root/hermes-studio
EnvironmentFile=/etc/hermes-studio.env
ExecStart=/bin/bash -lc 'exec node /root/hermes-studio/bin/hermes-studio.mjs start'
ExecStop=/bin/bash -lc 'exec node /root/hermes-studio/bin/hermes-studio.mjs stop'
PIDFile=/var/lib/hermes-studio/server.pid
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```

> 按实际情况改 `WorkingDirectory` 和两处路径中的 `/root/hermes-studio`。`bash -lc` 通过 login shell 加载 fnm/nvm 环境，无需硬编码 node 路径。

启用：

```bash
systemctl daemon-reload
systemctl enable --now hermes-studio
systemctl status hermes-studio
journalctl -u hermes-studio -f
```

## 更新

源码安装有两种更新方式。

### 方式一：内置命令（推荐）

```bash
hermes-studio update
```

它会在仓库目录自动执行：`git pull --ff-only` → `npm install` → `npm run build` → 重启。
仅对源码安装（git 检出）有效；若不在 git 仓库里会回退到 npm registry（本包未发布，会失败）。

`git pull` 非快进（本地有修改或需 rebase）时会报错退出，请先手动处理仓库状态。

### 方式二：手动

```bash
cd /opt/hermes-studio
git pull
npm install
npm run build
hermes-studio restart      # 用 systemd 就换 systemctl restart hermes-studio
```

注意：

- 保持仓库检出干净（配置走环境变量和数据目录，不要直接改仓库文件），否则 `git pull` 可能冲突。
- `npm install` 不会自动重建--`prepare` 只在 `dist/` 不存在时才构建；手动更新后必须 `npm run build`（`hermes-studio update` 已内置此步骤）。
- 想固定版本/标签：用 `git checkout <tag>` 代替 `git pull`，再 `npm install && npm run build && hermes-studio restart`。

## 常见问题

- **启动报 `spawn hermes ENOENT`**：机器上没有 `hermes` CLI。要么安装 Hermes Agent，要么设置 `HERMES_WEB_UI_DISABLE_GATEWAY_AUTOSTART=1` 先把 UI 跑起来。
- **数据/日志找不到**：CLI 与服务端默认数据目录不一致（`~/.hermes-studio` vs `~/.hermes-web-ui`）。显式设置 `HERMES_WEB_UI_HOME` 统一即可。
- **`npm run build` 失败**：多为类型检查（`vue-tsc`）报错。在仓库根目录跑 `npm run build` 查看详细错误；类型必须干净才能构建。
- **端口被占用**：`hermes-studio start` 会自动尝试释放端口；也可用 `--port` 指定，如 `node bin/hermes-studio.mjs start --port 8649`。
- **网页终端不可用**：`node-pty` 是可选原生模块，编译失败时终端功能不可用，但其余功能正常。确认 `node-pty` 已成功安装。
