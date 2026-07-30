# Hermes Web UI

A self-hosted web console for [Hermes Agent](https://github.com/NousResearch/hermes-agent).
Chat with agents, manage models and profiles, connect platform channels,
automate jobs, and keep everything local.

```bash
git clone https://github.com/svefnz/hermes-studio.git
cd hermes-studio
docker compose up -d --build
```

Open **<http://localhost:8648>**

---

## Core Capabilities

| Area | What it does |
| --- | --- |
| **Agent chat** | Streaming conversations, tool traces, file upload/download, persistent local sessions |
| **Control plane** | Profiles, providers, models, credentials, memory, skills, plugins, logs, runtime settings |
| **Automation** | Cron jobs, Kanban tasks, group-chat rooms, MCP servers, platform channel integration |
| **Workspace tools** | File browser, web terminal, voice input/output, coding-agent runners |

## Features

### AI Chat

- Real-time streaming over Socket.IO
- Multi-session management with grouping by source
- Markdown rendering, syntax highlighting, code copy
- Tool call detail expansion, file upload/download
- Session search (Ctrl+K), profile-aware model selector

### Platform Channels

Configure **8 platforms** from one page: Telegram, Discord, Slack, WhatsApp, Matrix, Feishu, WeChat, WeCom.

### Automation

- **Scheduled Jobs** — cron-based task automation with pause/resume
- **Kanban** — profile-aware task board for planning agent work
- **Workflows** — visual multi-node automation with branching and routing
- **Group Chat** — multi-agent rooms with @mention routing and context compression

### Model & Provider Management

- Auto-discover models from credential pool
- Fetch available models from each provider endpoint
- Add, update, delete providers (preset & custom OpenAI-compatible)
- OAuth login for OpenAI Codex, Nous Portal, Copilot, xAI, Anthropic
- Provider-level model grouping with default model switching

### Multi-Profile

Create, rename, clone, export/import profiles. Profile-scoped config, cache, uploads, sessions, jobs, usage, memory, skills, plugins, providers, and model visibility.

### Skills, Memory & Plugins

- Browse and search installed skills, view skill details
- User notes and profile memory management
- Plugin management

### File Browser

Browse files on remote backends (local, Docker, SSH, Singularity). Upload, download, rename, copy, move, delete, create directories, view with syntax highlighting.

### Logs & Monitoring

- Structured log viewer with level/file/keyword filtering
- Performance monitor (CPU, memory, workers, active sessions)
- Usage analytics with token breakdown and model distribution

### Voice / TTS / STT

- Read assistant replies aloud
- Turn-based voice input with browser or server-backed STT
- Providers: browser Web Speech, Edge TTS, OpenAI-compatible, custom endpoints

### Web Terminal

Integrated terminal powered by node-pty and @xterm/xterm with multi-session support.

### Coding Agents

Launch and monitor local coding-agent sessions (Claude Code, Codex) from the dashboard.

### MCP & Runtime Management

- MCP server management with tool visibility controls
- Runtime version management and preview tooling

### Authentication

- Token-based auth (auto-generated on first run)
- Username/password login with account management
- Super admin / regular admin role support

---

## Quick Start

### Docker Compose

```bash
git clone https://github.com/svefnz/hermes-studio.git
cd hermes-studio
docker compose up -d --build
```

Open **<http://localhost:8648>**

See [docs/server-deploy.md](./docs/server-deploy.md) for configuration details.

---

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8648` | Listen port |
| `BIND_HOST` | `0.0.0.0` | Bind host |
| `HERMES_WEB_UI_HOME` | `~/.hermes-web-ui` | Data directory |
| `AUTH_TOKEN` | auto-generated | Bearer token |
| `LOG_LEVEL` | `info` | Server log level |
| `PROFILE` | `default` | Startup profile |
| `CORS_ORIGINS` | same host | CORS allowlist |

Full list in [DEVELOPMENT.md](./DEVELOPMENT.md#environment-variables).

---

## Development

```bash
git clone <your-fork-url>
cd hermes-studio
npm install
npm run dev
```

- Frontend: <http://localhost:8649>
- BFF Server: <http://localhost:8647>

```bash
npm run build   # outputs to dist/
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Tech Stack

**Frontend:** Vue 3 + TypeScript + Vite + Naive UI + Pinia + Vue Router + vue-i18n

**Backend:** Koa 2 + Socket.IO + node-pty

---

## License

[BSL-1.1](./LICENSE)
