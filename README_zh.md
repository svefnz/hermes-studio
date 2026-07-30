# Hermes Web UI

自部署的 [Hermes Agent](https://github.com/NousResearch/hermes-agent) Web 控制台。
与 Agent 对话、管理模型和配置、连接平台频道、自动化任务，一切本地运行。

```bash
git clone https://github.com/svefnz/hermes-studio.git
cd hermes-studio
docker compose up -d --build
```

打开 **<http://localhost:8648>**

---

## 核心功能

| 模块 | 功能 |
| --- | --- |
| **Agent 对话** | 实时流式对话、工具调用追踪、文件上传/下载、持久化本地会话 |
| **控制面板** | 配置档案、Provider、模型、凭据、记忆、技能、插件、日志、运行时设置 |
| **自动化** | 定时任务、看板、群聊、MCP 服务器、平台频道集成 |
| **工作区工具** | 文件浏览器、Web 终端、语音输入/输出、编程工具 |

## 功能详情

### AI 对话

- 基于 Socket.IO 的实时流式对话
- 多会话管理，按来源分组
- Markdown 渲染、语法高亮、代码复制
- 工具调用详情展开、文件上传/下载
- 会话搜索 (Ctrl+K)、Profile 感知的模型选择器

### 平台频道

在一个页面中配置 **8 个平台**：Telegram、Discord、Slack、WhatsApp、Matrix、飞书、微信、企业微信。

### 自动化

- **定时任务** — 基于 cron 的任务自动化，支持暂停/恢复
- **看板** — Profile 感知的任务管理面板
- **工作流** — 可视化多节点自动化，支持分支和路由
- **群聊** — 多 Agent 房间，支持 @提及路由和上下文压缩

### 模型与 Provider 管理

- 从凭据池自动发现模型
- 从各 Provider 端点获取可用模型
- 添加、更新、删除 Provider（预设和自定义 OpenAI 兼容）
- OAuth 登录：OpenAI Codex、Nous Portal、Copilot、xAI、Anthropic
- Provider 级模型分组与默认模型切换

### 多 Profile

创建、重命名、克隆、导入/导出 Profile。Profile 级别的配置、缓存、上传、会话、任务、用量、记忆、技能、插件、Provider 和模型可见性。

### 技能、记忆与插件

- 浏览和搜索已安装技能，查看技能详情
- 用户笔记和 Profile 记忆管理
- 插件管理

### 文件浏览器

在远程后端（本地、Docker、SSH、Singularity）浏览文件。支持上传、下载、重命名、复制、移动、删除、创建目录、语法高亮查看。

### 日志与监控

- 结构化日志查看器，支持级别/文件/关键词过滤
- 性能监控（CPU、内存、Worker、活跃会话）
- 用量分析（Token 消耗分布、模型使用统计）

### 语音 / TTS / STT

- 朗读助手回复
- 基于回合的语音输入（浏览器或服务端 STT）
- Provider：浏览器 Web Speech、Edge TTS、OpenAI 兼容、自定义端点

### Web 终端

基于 node-pty 和 @xterm/xterm 的集成终端，支持多会话。

### 编程工具

从仪表板启动和监控本地编程工具会话（Claude Code、Codex）。

### MCP 与运行时管理

- MCP 服务器管理，支持工具可见性控制
- 运行时版本管理和预览工具

### 认证

- 基于 Token 的认证（首次运行自动生成）
- 用户名/密码登录，支持账户管理
- 超级管理员 / 普通管理员角色

---

## 快速开始

### Docker Compose

```bash
git clone https://github.com/svefnz/hermes-studio.git
cd hermes-studio
docker compose up -d --build
```

打开 **<http://localhost:8648>**

详见 [docs/server-deploy.md](./docs/server-deploy.md)。

---

## 开发

```bash
git clone <你的 fork 地址>
cd hermes-studio
npm install
npm run dev
```

- 前端：<http://localhost:8649>
- 后端：<http://localhost:8647>

```bash
npm run build   # 输出到 dist/
```

详见 [DEVELOPMENT.md](./DEVELOPMENT.md) 和 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 技术栈

**前端：** Vue 3 + TypeScript + Vite + Naive UI + Pinia + Vue Router + vue-i18n

**后端：** Koa 2 + Socket.IO + node-pty

---

## 许可证

[BSL-1.1](./LICENSE)
