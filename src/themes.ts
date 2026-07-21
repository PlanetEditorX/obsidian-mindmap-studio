import type { MindMapAppearance, MindMapThemePresetId } from "./model";

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
  }
] as const;

export function getMindMapThemePreset(id: MindMapThemePresetId | undefined): MindMapThemePreset | undefined {
  return MINDMAP_THEME_PRESETS.find((preset) => preset.id === id);
}

export function appearanceFromThemePreset(id: MindMapThemePresetId): MindMapAppearance {
  const preset = getMindMapThemePreset(id) ?? MINDMAP_THEME_PRESETS[0];
  return {
    ...preset.appearance,
    themePreset: preset.id,
    branchColors: preset.appearance.branchColors ? [...preset.appearance.branchColors] : undefined
  };
}
