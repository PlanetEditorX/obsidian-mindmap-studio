/**
 * @file themes.ts
 * @description 内置主题预设模块。
 *
 * 主题同时覆盖画布、节点、字体、分支颜色和连接线，应用后仍允许用户继续覆盖单项外观。
 */

import type { MindMapAppearance, MindMapThemePresetId } from "./model";

/**
 * MindMapThemePreset 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapThemePreset {
  id: MindMapThemePresetId;
  name: string;
  description: string;
  appearance: MindMapAppearance;
}

export const MINDMAP_THEME_PRESETS: readonly MindMapThemePreset[] = [
  {
    id: "classic-indigo",
    name: "经典靛蓝",
    description: "清爽、通用，适合项目与知识整理",
    appearance: {
      backgroundColor: "#f8fafc",
      backgroundPattern: "grid",
      patternColor: "#94a3b8",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#4f46e5",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#172033",
      nodeBorderColor: "#c7d2fe",
      nodeBorderWidth: 1,
      edgeColor: "#6366f1",
      edgeStyle: "curved",
      edgeWidth: 4.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.2,
      colorfulBranches: true,
      branchColors: ["#4f46e5", "#0284c7", "#0f766e", "#7c3aed", "#db2777", "#ea580c"]
    }
  },
  {
    id: "ocean-blue",
    name: "深海蓝",
    description: "冷静、专业，适合分析与技术内容",
    appearance: {
      backgroundColor: "#f0f9ff",
      backgroundPattern: "dots",
      patternColor: "#7dd3fc",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#075985",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#0c4a6e",
      nodeBorderColor: "#bae6fd",
      nodeBorderWidth: 1,
      edgeColor: "#0284c7",
      edgeStyle: "curved",
      edgeWidth: 4.5,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#0369a1", "#0891b2", "#0d9488", "#2563eb", "#4f46e5", "#06b6d4"]
    }
  },
  {
    id: "forest-green",
    name: "森林绿",
    description: "自然、沉稳，适合计划与成长主题",
    appearance: {
      backgroundColor: "#f7fee7",
      backgroundPattern: "dots",
      patternColor: "#86efac",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#3f6212",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#365314",
      nodeBorderColor: "#bbf7d0",
      nodeBorderWidth: 1,
      edgeColor: "#65a30d",
      edgeStyle: "curved",
      edgeWidth: 4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#4d7c0f", "#15803d", "#0f766e", "#65a30d", "#059669", "#84cc16"]
    }
  },
  {
    id: "sunset-orange",
    name: "日落橙",
    description: "温暖、有活力，适合创意与营销内容",
    appearance: {
      backgroundColor: "#fff7ed",
      backgroundPattern: "grid",
      patternColor: "#fdba74",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#c2410c",
      rootTextColor: "#ffffff",
      nodeColor: "#fffaf5",
      textColor: "#7c2d12",
      nodeBorderColor: "#fed7aa",
      nodeBorderWidth: 1,
      edgeColor: "#f97316",
      edgeStyle: "curved",
      edgeWidth: 4.4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.2,
      colorfulBranches: true,
      branchColors: ["#ea580c", "#f59e0b", "#dc2626", "#db2777", "#d97706", "#f97316"]
    }
  },
  {
    id: "lavender-dream",
    name: "薰衣草",
    description: "柔和、优雅，适合阅读笔记与灵感整理",
    appearance: {
      backgroundColor: "#faf5ff",
      backgroundPattern: "dots",
      patternColor: "#d8b4fe",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#7e22ce",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#581c87",
      nodeBorderColor: "#e9d5ff",
      nodeBorderWidth: 1,
      edgeColor: "#a855f7",
      edgeStyle: "curved",
      edgeWidth: 4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#9333ea", "#c026d3", "#7c3aed", "#db2777", "#6366f1", "#a855f7"]
    }
  },
  {
    id: "candy-pop",
    name: "糖果缤纷",
    description: "多彩、轻快，适合头脑风暴与生活记录",
    appearance: {
      backgroundColor: "#fff7fb",
      backgroundPattern: "dots",
      patternColor: "#f9a8d4",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#db2777",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#4a1630",
      nodeBorderColor: "#fbcfe8",
      nodeBorderWidth: 1,
      edgeColor: "#ec4899",
      edgeStyle: "curved",
      edgeWidth: 4.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.1,
      colorfulBranches: true,
      branchColors: ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"]
    }
  },
  {
    id: "paper-note",
    name: "纸张笔记",
    description: "温润、书写感，适合读书笔记与长文梳理",
    appearance: {
      backgroundColor: "#fffdf7",
      backgroundPattern: "grid",
      patternColor: "#d6c8ad",
      fontFamily: "serif",
      fontSize: 15,
      rootColor: "#7c2d12",
      rootTextColor: "#fffaf0",
      nodeColor: "#fffaf0",
      textColor: "#3f2a1d",
      nodeBorderColor: "#d6c8ad",
      nodeBorderWidth: 1,
      edgeColor: "#9a6b42",
      edgeStyle: "curved",
      edgeWidth: 3.6,
      edgeWidthMode: "tapered",
      edgeMinWidth: 0.9,
      colorfulBranches: true,
      branchColors: ["#9a3412", "#a16207", "#4d7c0f", "#0f766e", "#7e22ce", "#be123c"]
    }
  },
  {
    id: "minimal-ink",
    name: "极简墨色",
    description: "黑白克制，适合正式文档与结构图",
    appearance: {
      backgroundColor: "#ffffff",
      backgroundPattern: "none",
      patternColor: "#d1d5db",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#111827",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#111827",
      nodeBorderColor: "#9ca3af",
      nodeBorderWidth: 1,
      edgeColor: "#4b5563",
      edgeStyle: "straight",
      edgeWidth: 3.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 0.8,
      colorfulBranches: false,
      branchColors: ["#111827", "#374151", "#4b5563", "#6b7280"]
    }
  },
  {
    id: "dark-neon",
    name: "暗夜霓虹",
    description: "高对比深色主题，适合夜间与科技内容",
    appearance: {
      backgroundColor: "#080d1a",
      backgroundPattern: "dots",
      patternColor: "#334155",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#7c3aed",
      rootTextColor: "#ffffff",
      nodeColor: "#111827",
      textColor: "#e5e7eb",
      nodeBorderColor: "#334155",
      nodeBorderWidth: 1,
      edgeColor: "#818cf8",
      edgeStyle: "curved",
      edgeWidth: 4.6,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.1,
      colorfulBranches: true,
      branchColors: ["#8b5cf6", "#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"]
    }
  },
  {
    id: "mint-clean",
    name: "薄荷清新",
    description: "清透、简洁，适合工作清单与流程梳理",
    appearance: {
      backgroundColor: "#f0fdfa",
      backgroundPattern: "grid",
      patternColor: "#99f6e4",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#047857",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#134e4a",
      nodeBorderColor: "#a7f3d0",
      nodeBorderWidth: 1,
      edgeColor: "#14b8a6",
      edgeStyle: "curved",
      edgeWidth: 4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#059669", "#0d9488", "#0891b2", "#65a30d", "#0284c7", "#10b981"]
    }
  },
  {
    id: "spectrum-flow",
    name: "光谱脉络",
    description: "高辨识度的多彩分支，适合头脑风暴与主题拆解",
    appearance: {
      backgroundColor: "#ffffff",
      backgroundPattern: "none",
      patternColor: "#e5e7eb",
      fontFamily: "sans",
      fontSize: 15,
      rootColor: "#11113f",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#111827",
      nodeBorderColor: "#d1d5db",
      nodeBorderWidth: 1.5,
      edgeColor: "#4f46e5",
      edgeStyle: "curved",
      edgeWidth: 5,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.2,
      colorfulBranches: true,
      branchColors: ["#ff443d", "#f59f45", "#f6c914", "#05b981", "#4868f7", "#5148c8", "#de3c78", "#19a7ce"]
    }
  },
  {
    id: "executive-navy",
    name: "远洋商务",
    description: "克制的海军蓝与青色层次，适合汇报、分析和项目规划",
    appearance: {
      backgroundColor: "#f5f8fc",
      backgroundPattern: "grid",
      patternColor: "#cbd5e1",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#132a4f",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#172b4d",
      nodeBorderColor: "#9fb7d4",
      nodeBorderWidth: 1,
      edgeColor: "#315d8c",
      edgeStyle: "curved",
      edgeWidth: 4.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#1f4e79", "#287f8f", "#3b6ea8", "#64748b", "#0f766e", "#475569"]
    }
  },
  {
    id: "botanical-calm",
    name: "植物静语",
    description: "柔和的苔绿、鼠尾草与泥土色，适合阅读和生活规划",
    appearance: {
      backgroundColor: "#f7f8f2",
      backgroundPattern: "dots",
      patternColor: "#cbd5b1",
      fontFamily: "serif",
      fontSize: 15,
      rootColor: "#344e41",
      rootTextColor: "#ffffff",
      nodeColor: "#fbfcf7",
      textColor: "#33433a",
      nodeBorderColor: "#b7c4a3",
      nodeBorderWidth: 1,
      edgeColor: "#6b8064",
      edgeStyle: "curved",
      edgeWidth: 3.8,
      edgeWidthMode: "tapered",
      edgeMinWidth: 0.9,
      colorfulBranches: true,
      branchColors: ["#52796f", "#7a8f62", "#a98467", "#6b705c", "#588157", "#8b7e66"]
    }
  },
  {
    id: "midnight-signal",
    name: "午夜信号",
    description: "深蓝画布与明亮信号色，适合技术架构和夜间使用",
    appearance: {
      backgroundColor: "#07111f",
      backgroundPattern: "grid",
      patternColor: "#24364b",
      fontFamily: "mono",
      fontSize: 14,
      rootColor: "#e6f6ff",
      rootTextColor: "#07111f",
      nodeColor: "#0f1d2e",
      textColor: "#dbeafe",
      nodeBorderColor: "#35516f",
      nodeBorderWidth: 1,
      edgeColor: "#38bdf8",
      edgeStyle: "elbow",
      edgeWidth: 3.8,
      edgeWidthMode: "uniform",
      edgeMinWidth: 3.8,
      colorfulBranches: true,
      branchColors: ["#38bdf8", "#2dd4bf", "#a78bfa", "#fb7185", "#facc15", "#60a5fa"]
    }
  },
  {
    id: "sketchbook-warm",
    name: "暖纸手稿",
    description: "温暖纸张与铅笔色调，适合学习笔记和创意草图",
    appearance: {
      backgroundColor: "#fbf5e9",
      backgroundPattern: "dots",
      patternColor: "#d8c8ad",
      fontFamily: "serif",
      fontSize: 15,
      rootColor: "#5f4b3b",
      rootTextColor: "#fffaf0",
      nodeColor: "#fffaf0",
      textColor: "#49382c",
      nodeBorderColor: "#aa927b",
      nodeBorderWidth: 1.5,
      edgeColor: "#796453",
      edgeStyle: "curved",
      edgeWidth: 3.2,
      edgeWidthMode: "uniform",
      edgeMinWidth: 3.2,
      colorfulBranches: true,
      branchColors: ["#9c6644", "#a98467", "#6b705c", "#7f5539", "#8a6f4d", "#7b6d8d"]
    }
  },
  {
    id: "monochrome-air",
    name: "黑白留白",
    description: "轻边框、大留白和单色层级，适合打印与正式结构图",
    appearance: {
      backgroundColor: "#ffffff",
      backgroundPattern: "none",
      patternColor: "#e5e7eb",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#18181b",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#27272a",
      nodeBorderColor: "#a1a1aa",
      nodeBorderWidth: 1,
      edgeColor: "#52525b",
      edgeStyle: "straight",
      edgeWidth: 2.5,
      edgeWidthMode: "uniform",
      edgeMinWidth: 2.5,
      colorfulBranches: false,
      branchColors: ["#18181b", "#3f3f46", "#71717a", "#a1a1aa"]
    }
  }
] as const;

/**
 * 读取并返回mind map theme preset，并保持模型、界面和持久化状态的一致性。
 *
 * @param id 目标对象或节点的稳定标识。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function getMindMapThemePreset(id: MindMapThemePresetId | undefined): MindMapThemePreset | undefined {
  return MINDMAP_THEME_PRESETS.find((preset) => preset.id === id);
}

/**
 * 执行“appearance from theme preset”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param id 目标对象或节点的稳定标识。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function appearanceFromThemePreset(id: MindMapThemePresetId): MindMapAppearance {
  const preset = getMindMapThemePreset(id) ?? MINDMAP_THEME_PRESETS[0];
  return {
    ...preset.appearance,
    themePreset: preset.id,
    branchColors: preset.appearance.branchColors ? [...preset.appearance.branchColors] : undefined
  };
}
