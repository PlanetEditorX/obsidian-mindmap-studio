/**
 * @file display-mode.ts
 * @description 显示模式的启动恢复与持久化规则。
 */

import type { DisplayMode } from "../core/model";

const ALL_MODES: readonly DisplayMode[] = ["mindmap", "outline", "article", "reading"];

/** 去重并过滤设置中未知的显示模式，空列表恢复为导图模式。 */
export function normalizeDisplayModes(value: readonly unknown[]): DisplayMode[] {
  const modes = value.filter((mode): mode is DisplayMode => ALL_MODES.includes(mode as DisplayMode));
  const fallback: DisplayMode[] = modes.length ? modes : ["mindmap"];
  return [...new Set<DisplayMode>(fallback)];
}

/**
 * 解析插件启动时允许恢复的显示模式。大纲只属于当前会话；
 * 重新加载插件时优先回到导图，其次选择可见的文章或通读模式。
 */
export function resolveStartupDisplayMode(preferred: unknown, visibleModes: readonly unknown[]): DisplayMode {
  const visible = normalizeDisplayModes(visibleModes);
  if (preferred === "mindmap" || preferred === "article" || preferred === "reading") {
    if (visible.includes(preferred)) return preferred;
  }
  if (visible.includes("mindmap")) return "mindmap";
  return visible.find((mode) => mode !== "outline") ?? visible[0] ?? "mindmap";
}

/** 大纲模式不写入下次启动设置，其他模式保持用户最后选择。 */
export function shouldPersistDisplayMode(mode: DisplayMode): boolean {
  return mode !== "outline";
}
