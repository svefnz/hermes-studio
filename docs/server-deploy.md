# 服务器部署指南

通过 Docker Compose 一键部署 Hermes Studio。

## 前置条件

- **Docker** + **Docker Compose**（v2+）
- **Hermes Agent**（可选）：如需 agent 对话功能，在宿主机上安装并运行 `hermes gateway`。Hermes Studio 通过 `localhost` 连接。

## 快速开始

```bash
git clone https://github.com/svefnz/hermes-studio.git
cd hermes-studio
docker compose up -d --build
```

启动后访问 `http://<服务器IP>:8648`。

## 配置

编辑 `docker-compose.yml` 中的 `environment` 部分：

```yaml
environment:
  - HERMES_WEB_UI_HOME=/data              # 容器内数据目录（保持默认）
  - HERMES_WEB_UI_DISABLE_GATEWAY_AUTOSTART=1  # 容器内不跑 hermes gateway
  - PORT=8648                             # 监听端口
  - BIND_HOST=0.0.0.0                     # 监听地址
  - LOG_LEVEL=info                        # 日志级别
  - AUTH_TOKEN=换成长随机串                # 访问 token（不设则首次自动生成）
```

> 使用 `network_mode: host`，容器直接用宿主机网络，`localhost` 可直连宿主机上的 Hermes Agent。

## 常用命令

```bash
docker compose up -d --build     # 构建并启动
docker compose down              # 停止并移除容器
docker compose logs -f           # 查看实时日志
docker compose restart           # 重启
docker compose pull && docker compose up -d --build  # 更新
```

## 登录

首次启动自动生成 token，查看日志获取：

```bash
docker compose logs | grep "auth.token"
```

创建/重置默认账号（admin / 123456）：

```bash
docker compose exec hermes-studio node scripts/reset-default-login.mjs
```

## 数据持久化

两组数据需要持久化：

| 数据 | 容器路径 | 宿主机路径 | 说明 |
| --- | --- | --- | --- |
| Web UI 数据 | `/data` | `/var/lib/hermes-studio` | DB、日志、上传、token |
| Hermes Agent 数据 | `/root/.hermes` | `/root/.hermes` | profiles、config.yaml、auth.json、凭据、模型配置 |

Hermes Agent 数据以 **只读** 方式挂载（`:ro`），Studio 读取 Agent 的 profiles 和凭据来驱动 Web 端，但不会修改 Agent 数据。

如需直接映射宿主机目录，把 `docker-compose.yml` 的 volumes 改为：

```yaml
volumes:
  - /var/lib/hermes-studio:/data
  - /root/.hermes:/root/.hermes:ro
```

> 如果 Hermes Agent 的数据目录不是 `~/.hermes`，或不是 root 用户部署，按实际路径调整。

## 更新

```bash
cd hermes-studio
git pull
docker compose up -d --build
```

## 连接宿主机 Hermes Agent

Hermes Studio 通过 `localhost` 连接同机 Hermes Agent 的 gateway 端口。确保：

1. 宿主机上 Hermes Agent 正在运行（`hermes gateway run`）
2. Hermes Studio 的 Web UI 设置中配置了正确的 gateway 地址（`localhost:<gateway端口>`）

如 gateway 不在默认端口，在 `docker-compose.yml` 中加：

```yaml
environment:
  - HERMES_BIN=/usr/local/bin/hermes   # 不需要，容器内不跑 hermes
```

> 容器内不运行 Hermes Agent（`HERMES_WEB_UI_DISABLE_GATEWAY_AUTOSTART=1`），所有 agent 请求通过宿主机网络转发。
