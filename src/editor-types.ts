/**
 * @file editor-types.ts
 * @description 编辑器与 Obsidian 宿主层之间的稳定类型契约。
 */

import type {
  DisplayMode,
  MindMapAppearance,
  MindMapCodeBlock,
  MindMapDocument,
  MindMapNode,
  MindMapSubmap,
  NodeShape
} from "./model";
import type { ArticlePageNavigation, ArticleTocEntry, ReadingSection } from "./modes";
import type { ImageHostChoice, ImageHostUploadBatch } from "./settings";

/**
 * Host services consumed by the editor.
 *
 * Keeping these callbacks outside the editor implementation makes the UI
 * testable without constructing the complete Obsidian plugin.
 */
export interface MindMapEditorCallbacks {
  onChange: (document: MindMapDocument) => void;
  onOpenLink: (link: string) => void | Promise<void>;
  onExportSvg: (svg: string) => void | Promise<void>;
  onExportMarkdown: (markdown: string) => void | Promise<void>;
  onExportJson: (json: string) => void | Promise<void>;
  onExportDocument: (format: "html" | "doc" | "pdf" | "md") => void | Promise<void>;
  resolveImage: (source: string) => string | null;
  onSavePastedImage: (blob: Blob, suggestedName: string) => Promise<string>;
  getImageHosts: () => ImageHostChoice[];
  getDefaultUploadHostIds: () => string[];
  onUploadImage: (blob: Blob, suggestedName: string, hostIds: string[]) => Promise<ImageHostUploadBatch>;
  onReadImageSource: (source: string) => Promise<{ blob: Blob; suggestedName: string } | null>;
  onScheduleAutoUpload: (nodeId: string, blockId: string, localPath: string, suggestedName: string) => boolean;
  onCreateSubmap: (node: MindMapNode) => Promise<MindMapSubmap>;
  onDeleteSubmap: (submap: MindMapSubmap) => Promise<boolean>;
  onOpenMindMap: (path: string, focusNodeId?: string) => void | Promise<void>;
  onOpenArticleDirectory: (path: string) => void | Promise<void>;
  onSearchMapFamily: () => void;
  onGlobalSearch: () => void;
  onDisplayModeChange: (mode: DisplayMode) => void | Promise<void>;
  onReadingProgressChange: (path: string, progress: number) => void | Promise<void>;
  onRenderCode: (block: MindMapCodeBlock, container: HTMLElement) => void | Promise<void>;
}

/**
 * Runtime editor configuration assembled by the view/plugin layer.
 */
export interface MindMapEditorOptions {
  defaultNodeShape: NodeShape;
  defaultAppearance: MindMapAppearance;
  showTaskProgress: boolean;
  autoFitOnOpen: boolean;
  historyLimit: number;
  imageFailoverEnabled: boolean;
  imageFailoverTimeoutSeconds: number;
  imageFailoverUseLocalFallback: boolean;
  visibleModes: DisplayMode[];
  defaultViewMode: DisplayMode;
  articleBaseDepth: number;
  articleTocEntries: ArticleTocEntry[];
  articleTocMaxDepth: number;
  showArticleToc: boolean;
  articleNavigation?: ArticlePageNavigation;
  readingSections: ReadingSection[];
  readingProgress: number;
  readingProgressPosition: "top" | "bottom" | "left" | "right";
  nodeEditorPosition: "center" | "right";
  richTextShortcuts: {
    bold: string;
    italic: string;
    underline: string;
    color: string;
  };
  visibleToolbarItems: string[];
  toolbarItemOrder: string[];
}
