/**
 * dsh-gamemode — 把 Minecraft 梗命令 `/gamemode 1` 变成
 * DeepSeek Harness 的“切换到创造模式”命令。
 *
 * 这里的“创造模式”就是 Agent Preset 系统里内置的 `cordis` 预设
 * （preset.yml 的 name 为“创造模式”），不是本插件自定义的提示词模式。
 *
 * 实现与 Web UI 的 preset 选择（host-apiproxy 的 agentPreset.select）一致：
 *   1. 仅当会话尚未开始（日志中没有 turn/start）时允许切换；
 *   2. 调用 ctx.agentPresets.recompose(agent.ctx, presetId) 重挂 preset；
 *   3. 向会话日志追加 `agent-preset/selected`，保证 resume/fork 时重建同一组合。
 *
 * `/gamemode 0` 对应内置 `standard` 预设（“标准模式”，即 Minecraft 生存模式梗）。
 * 命令本身是 log-only 平面，不会让会话脱离 blank 状态。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { AgentPreset } from '@deepseek-ai/dsh-agent-presets'
import type {} from '@deepseek-ai/dsh-agent-presets'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import type {} from '@deepseek-ai/dsh-commands'

export const name = 'dsh-gamemode'
/**
 * commands is required (the whole point). agentPresets is NOT declared in
 * inject: cordis 4.x resolves inject entries as service names (array form or
 * name→config map), so the {required, optional} object form would be looked
 * up as literal services "required"/"optional" and stay pending forever.
 * Optional deps are instead read via ctx.get() at call time (see the
 * handler), so rosterless/headless deployments still load the plugin and
 * report a clear "no preset system" error on use.
 */
export const inject = ['commands']

type GameMode = 'creative' | 'survival'

/** 内置预设的稳定 id；找不到时再按显示名回退。 */
const CREATIVE_PRESET_IDS = new Set(['cordis'])
const SURVIVAL_PRESET_IDS = new Set(['standard'])

function labelOf(preset: AgentPreset): string {
  return preset.name ?? preset.id
}

/** 与 api-proxy 的 sessionBlank 判定保持一致：跑过任意 turn 即锁定。 */
function isBlankSession(invocation: CommandInvocation): boolean {
  return !invocation.agent.session.events.some((event) => event.type === 'turn/start')
}

async function findPreset(presetsService: { list(): Promise<AgentPreset[]> }, mode: GameMode): Promise<AgentPreset | undefined> {
  const presets = await presetsService.list()
  if (mode === 'creative') {
    return presets.find((preset) => CREATIVE_PRESET_IDS.has(preset.id))
      ?? presets.find((preset) => preset.name !== undefined && /创造|creative/i.test(preset.name))
  }
  return presets.find((preset) => SURVIVAL_PRESET_IDS.has(preset.id))
    ?? presets.find((preset) => preset.name !== undefined && /标准|生存|standard|survival/i.test(preset.name))
}

function parseGameMode(rawInput: string): { mode?: GameMode; recognized: boolean } {
  const token = rawInput.trim().toLowerCase()
  if (!token) return { recognized: true }
  if (token === '1' || token === 'creative' || token === 'c' || token === '创造' || token === '创造模式') {
    return { mode: 'creative', recognized: true }
  }
  if (token === '0' || token === 'survival' || token === 's' || token === '生存' || token === '生存模式'
    || token === 'standard' || token === '标准' || token === '标准模式') {
    return { mode: 'survival', recognized: true }
  }
  return { recognized: false }
}

function usageText(): string {
  return '用法：/gamemode 1（创造模式，内置 cordis 预设）| /gamemode 0（标准模式）。仅在新会话（还没开始对话）可用。'
}

function makeHandler(ctx: Context) {
  return async function handleGamemod(invocation: CommandInvocation): Promise<CommandResult> {
    const { agent, rawInput } = invocation
    const presetsService = ctx.get('agentPresets')
    if (presetsService === undefined) {
      return {
        kind: 'error',
        text: '当前部署没有 Agent Preset 系统（agentPresets 服务未挂载），/gamemode 不可用。',
      }
    }
    const parsed = parseGameMode(rawInput)
    if (!parsed.recognized) {
      return {
        kind: 'error',
        text: `无法识别的游戏模式。${usageText()}`,
      }
    }

    if (parsed.mode === undefined) {
      const current = presetsService.composedPreset(agent.ctx)
      const presets = await presetsService.list()
      const currentPreset = presets.find((preset) => preset.id === current)
      const label = currentPreset === undefined
        ? (current ?? '（未挂载 Agent Preset）')
        : `${labelOf(currentPreset)}（${currentPreset.id}）`
      return {
        kind: 'success',
        text: `当前预设：${label}。${usageText()}`,
      }
    }

    const target = await findPreset(presetsService, parsed.mode)
    if (target === undefined || target.broken !== undefined) {
      const reason = target?.broken === undefined ? '内置预设不存在' : target.broken
      return {
        kind: 'error',
        text: `找不到可用的${parsed.mode === 'creative' ? '创造模式' : '标准模式'}预设（cordis / standard）：${reason}。可用预设请用界面预设选择查看。`,
      }
    }

    const current = presetsService.composedPreset(agent.ctx)
    if (current === target.id) {
      return {
        kind: 'success',
        text: `已经是${labelOf(target)}（预设 id：${target.id}），无需切换。`,
      }
    }

    if (!isBlankSession(invocation)) {
      return {
        kind: 'error',
        text: `会话已开始，Agent 预设已锁定，不能再切换（与界面预设选择规则一致）。请新建会话，在发第一条消息前使用 /gamemode 1。`,
      }
    }

    try {
      const switched = await presetsService.recompose(agent.ctx, target.id)
      agent.session.append('agent-preset/selected', { agentPreset: switched.id })
      return {
        kind: 'success',
        text: `已切换到${labelOf(switched)}（预设 id：${switched.id}）。输入 /gamemode 1 成功切换为创造模式。`,
      }
    } catch (error) {
      return {
        kind: 'error',
        text: `切换预设失败：${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const handler = makeHandler(ctx)
    const disposeGamemode = ctx.commands.register({
      name: 'gamemode',
      description: '切换 Agent 预设：/gamemode 1 = 创造模式（cordis），/gamemode 0 = 标准模式',
      input: { hint: '1 = 创造模式（cordis 预设），0 = 标准模式' },
      handler,
    })
    return () => {
      disposeGamemode()
    }
  }, 'dsh-gamemode: preset-switch commands')
}
