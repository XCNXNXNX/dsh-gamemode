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
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-gamemode";
/**
 * commands is required (the whole point). agentPresets is NOT declared in
 * inject: cordis 4.x resolves inject entries as service names (array form or
 * name→config map), so the {required, optional} object form would be looked
 * up as literal services "required"/"optional" and stay pending forever.
 * Optional deps are instead read via ctx.get() at call time (see the
 * handler), so rosterless/headless deployments still load the plugin and
 * report a clear "no preset system" error on use.
 */
export declare const inject: string[];
export declare function apply(ctx: Context): void;
