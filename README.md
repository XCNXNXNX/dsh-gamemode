# dsh-gamemode

DSH 插件：`/gamemode 1` = 一键切换到 DeepSeek Harness 内置“创造模式”（`cordis`）Agent 预设。
DSH plugin: `/gamemode 1` = one-command switch to the built-in Creative Mode (`cordis`) agent preset.

![gamemode showcase](./assets/gamemode.png)

[English](#english) | [中文](#chinese)

---

## English

A tiny [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) slash-command plugin that turns the Minecraft-meme command `/gamemode 1` into a real switch to the built-in **Creative Mode** agent preset.

In DeepSeek Harness, Creative Mode is the built-in `cordis` preset (its `preset.yml` declares `name: 创造模式`). This plugin performs the exact same operation as the Web UI preset picker:

1. `ctx.agentPresets.recompose(agent.ctx, presetId)` — re-links the live agent to the preset's standing mount.
2. `agent.session.append('agent-preset/selected', { agentPreset })` — records the durable selection so resume/fork rebuilds the same composition.

### One-command install

```bash
dsh plugin --profile web add dsh-gamemode
```

Other install sources:

```bash
# straight from GitHub (prebuilt lib/ is committed, no build allowlist needed)
dsh plugin --profile web add github:XCNXNXNX/dsh-gamemode

# or the prebuilt release tarball
dsh plugin --profile web add https://github.com/XCNXNXNX/dsh-gamemode/releases/download/v0.0.3/dsh-gamemode-0.0.3.tgz
```

The package declares `dsh.bundle`; `cordis.patch.yml` inserts the plugin row automatically. If your profile has another name, replace `web` with it.

### Usage

| Command | Effect |
| --- | --- |
| `/gamemode 1` (or `/gamemode creative`) | Switch to Creative Mode (`cordis` preset) |
| `/gamemode 0` (or `/gamemode survival`) | Switch to Standard Mode (`standard` preset) |
| `/gamemode` | Show the current preset |

### Limitation (same as the official UI)

An agent preset can only be switched while the session is still **blank** — before any `turn/start` has been written. Once the conversation starts, the preset is locked, because the history was produced under the old composition. Use `/gamemode 1` on a new session before sending your first message.

### Build

With a DeepSeek Harness checkout:

```bash
bash scripts/build.sh
```

Install/inject the produced package with the DSH plugin tooling, e.g. `dev_inject_plugin`.

### License

[BSD-3-Clause](./LICENSE)

---

## 中文

一个极简的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 斜杠命令插件：把 Minecraft 梗命令 `/gamemode 1` 变成真正切换内置 **“创造模式” Agent 预设**的命令。

DeepSeek Harness 里的“创造模式”就是内置 `cordis` 预设（其 `preset.yml` 声明 `name: 创造模式`）。本插件执行与 Web UI 预设选择器完全相同的官方路径：

1. `ctx.agentPresets.recompose(agent.ctx, presetId)` — 把当前 live agent 重新挂到目标预设的 standing mount；
2. `agent.session.append('agent-preset/selected', { agentPreset })` — 落盘持久选择，resume/fork 时能重建同一组合。

### 一句话安装

```bash
dsh plugin --profile web add dsh-gamemode
```

其他安装来源：

```bash
# 直接从 GitHub 安装（已提交预构建 lib/，无需 pnpm 构建授权）
dsh plugin --profile web add github:XCNXNXNX/dsh-gamemode

# 或使用预构建的 Release tarball
dsh plugin --profile web add https://github.com/XCNXNXNX/dsh-gamemode/releases/download/v0.0.3/dsh-gamemode-0.0.3.tgz
```

包已声明 `dsh.bundle`，`cordis.patch.yml` 会自动插入插件行。如果你的 profile 名不是 `web`，把命令里的 `web` 换成自己的 profile 名。

### 用法

| 命令 | 作用 |
| --- | --- |
| `/gamemode 1`（或 `/gamemode creative`） | 切换到创造模式（`cordis` 预设） |
| `/gamemode 0`（或 `/gamemode survival`） | 切换到标准模式（`standard` 预设） |
| `/gamemode` | 查看当前会话预设 |

### 限制（与官方界面一致）

Agent 预设只能在会话**尚未开始**（日志中还没有 `turn/start`）时切换。对话一旦开始，预设即锁定——因为历史是在旧组合下产生的。请在**新会话**发送第一条消息前使用 `/gamemode 1`。

### 构建

在有 DeepSeek Harness checkout 的环境：

```bash
bash scripts/build.sh
```

用 DSH 插件工具链安装/注入生成的包，例如 `dev_inject_plugin`。

---

![Good](./assets/good.png)
