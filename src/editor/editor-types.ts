/**
 * @file editor-types.ts
 * @description 编辑器领域与 Obsidian 宿主层之间的稳定类型契约。
 */

import type {
  ArticleLeafNumberingStyle,
  DisplayMode,
  MindMapAppearance,
  MindMapCodeBlock,
  MindMapDocument,
  MindMapImageContentBlock,
  MindMapNode,
  MindMapSubmap,
  NodeShape
} from "../core/model";
import type { ArticlePageNavigation, ArticleTocEntry, ReadingSection } from "../article/modes";
import type { ReadingLocation } from "../article/reading-location";
import type { ArticleEntryLockMode } from "../article/display-mode";
import type { ArticleLeafBulletStyle, ArticleLeafTextAlignment, ImageHostChoice, ImageHostUploadBatch } from "../settings";
import type { DesktopCaptureResult } from "../utils/desktop-capture";
import type { ImageRecognitionItemResult, RecognizableImage } from "../vision/recognition";

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
  getLastImportFolder: () => string;
  onRememberImportFolder: (folder: string) => void | Promise<void>;
  onImportMarkdownImages: (document: MindMapDocument, sourceDirectory: string) => Promise<number>;
  onExportDocument: (format: "html" | "doc" | "pdf" | "md") => void | Promise<void>;
  resolveImage: (source: string) => string | null;
  onSavePastedImage: (blob: Blob, suggestedName: string) => Promise<string>;
  getImageHosts: () => ImageHostChoice[];
  getDefaultUploadHostIds: () => string[];
  onUploadImage: (blob: Blob, suggestedName: string, hostIds: string[]) => Promise<ImageHostUploadBatch>;
  onReadImageSource: (source: string) => Promise<{ blob: Blob; suggestedName: string } | null>;
  onScheduleAutoUpload: (nodeId: string, blockId: string, localPath: string, suggestedName: string) => boolean;
  onDeleteRecognizedImageLocalAsset: (localPath: string, blockId: string) => Promise<boolean>;
  /** Removes remote mirrors only when no other map still references the same hash or URL. */
  onCleanupRemovedImageRemoteAssets: (block: MindMapImageContentBlock, documentAfterRemoval: MindMapDocument) => Promise<void>;
  onRecognizeImage: (image: RecognizableImage, blob: Blob, remoteUrl?: string, instruction?: string) => Promise<ImageRecognitionItemResult>;
  onEnrichQuestion: (questionText: string) => Promise<string>;
  onCaptureScreenshot: (recognizeAfter?: boolean) => Promise<DesktopCaptureResult>;
  onCreateSubmap: (node: MindMapNode) => Promise<MindMapSubmap>;
  onDeleteSubmap: (submap: MindMapSubmap) => Promise<boolean>;
  onExtractToSubmap: (node: MindMapNode) => Promise<MindMapSubmap>;
  onMergeFromSubmap: () => Promise<void>;
  onOpenMindMap: (path: string, focusNodeId?: string) => void | Promise<void>;
  onOpenArticleDirectory: (path: string) => void | Promise<void>;
  onSearchMapFamily: () => void;
  onGlobalSearch: () => void;
  onAskAi: (nodeId?: string) => void | Promise<void>;
  onDisplayModeChange: (mode: DisplayMode, location?: ReadingLocation) => void | Promise<void>;
  onReadingLocationChange: (path: string, location: ReadingLocation) => void | Promise<void>;
  /** Persists article mode's own last lock state independently from other display modes. */
  onArticleReadOnlyChange: (readOnly: boolean) => void | Promise<void>;
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
  twoFingerGestureAction: "zoom" | "pan";
  historyLimit: number;
  imageFailoverEnabled: boolean;
  imageFailoverTimeoutSeconds: number;
  imageFailoverUseLocalFallback: boolean;
  /** Enabled image host IDs ordered from highest to lowest render priority. */
  imageHostPriorityIds: string[];
  visibleModes: DisplayMode[];
  defaultViewMode: DisplayMode;
  articleEntryLockMode: ArticleEntryLockMode;
  articleLastReadOnly: boolean;
  currentFilePath: string;
  readingHomePath: string;
  readingLocation: ReadingLocation | null;
  /**
   * 当前文件由用户显式打开时，第一次文章族上下文刷新应以当前文件为准，
   * 不能立即根据旧的跨文件阅读记录跳回另一个父/子导图。
   */
  preferCurrentFileLocation: boolean;
  articleBaseDepth: number;
  articleTocEntries: ArticleTocEntry[];
  articleTocMaxDepth: number;
  showArticleMiniMap: boolean;
  articleSectionCollapseEnabled: boolean;
  articleLeafBulletsEnabled: boolean;
  articleLeafBulletColor: string;
  articleLeafBulletStyle: ArticleLeafBulletStyle;
  articleLeafTextAlignment: ArticleLeafTextAlignment;
  articleLeafNumberingEnabled: boolean;
  articleLeafNumberingStyle: ArticleLeafNumberingStyle;
  articleLeafNumberingThreshold: number;
  showArticleToc: boolean;
  articleNavigation?: ArticlePageNavigation;
  readingSections: ReadingSection[];
  readingProgressPosition: "top" | "bottom" | "left" | "right";
  returnToTopVisibility: number;
  nodeEditorPosition: "center" | "right";
  richTextShortcuts: {
    bold: string;
    italic: string;
    underline: string;
    color: string;
  };
  visibleToolbarItems: string[];
  toolbarItemOrder: string[];
  imageRecognitionMode: "ai" | "local-ocr";
  imageRecognitionAutoConfirmDelaySeconds: 0 | 5 | 10 | 15 | null;
  autoUploadDelaySeconds: number;
  screenshotShortcut: string;
  screenshotRecognizeShortcut: string;
  questionNodesEnabled: boolean;
  /** Enables the full-page practice mode only for maps inside the configured question-bank folder. */
  questionBankModeEnabled: boolean;
  /** Ordering used when starting or restarting an answer-mode session. */
  questionPracticeOrder: "random" | "sequential";
  questionMemoryCurveEnabled: boolean;
  wrongBookMasteryCount: number;
}
