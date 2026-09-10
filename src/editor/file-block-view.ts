/** @file file-block-view.ts
 * @description 文件内容块卡片的共享渲染：导图画布、文章、大纲与节点编辑器复用同一 DOM 结构。
 */

import { setIcon } from "obsidian";
import type { MindMapFileContentBlock } from "../core/model";

/**
 * 文件卡片渲染选项：打开与右键回调由各渲染面注入。
 */
export interface FileCardOptions {
  /** 追加到统一 `mmc-file-card` 基类之外的宿主面样式类。 */
  cls: string;
  /** 点击卡片时打开附件文件。 */
  onOpen: () => void;
  /** 右键卡片时交给宿主上下文菜单；省略时不绑定右键。 */
  onContextMenu?: (event: MouseEvent) => void;
}

/**
 * 将文件块的字节数格式化为短文本；`size` 缺省时返回空字符串。
 *
 * @param block 当前文件内容块。
 * @returns 形如 `1.5 KB` 的可读大小，无大小时为空。
 */
export function fileCardSizeLabel(block: Pick<MindMapFileContentBlock, "size">): string {
  const bytes = block.size;
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * 渲染统一文件卡片：图标 + 文件名 + 可读大小；点击打开附件，右键交给宿主菜单。
 *
 * @param container 宿主容器元素。
 * @param block 当前文件内容块；卡片 DOM 会写入 `data-block-id`。
 * @param options 打开与右键回调及宿主面样式类。
 * @returns 创建的卡片元素。
 */
export function renderFileCard(container: HTMLElement, block: MindMapFileContentBlock, options: FileCardOptions): HTMLElement {
  const card = container.createDiv({ cls: `mmc-file-card ${options.cls}` });
  card.dataset.blockId = block.id;
  const icon = card.createSpan({ cls: "mmc-file-card-icon", attr: { "aria-hidden": "true" } });
  setIcon(icon, "file-text");
  const body = card.createDiv({ cls: "mmc-file-card-body" });
  body.createDiv({ cls: "mmc-file-card-name", text: block.name, attr: { title: `${block.name}（${block.source}）` } });
  const sizeLabel = fileCardSizeLabel(block);
  if (sizeLabel) body.createDiv({ cls: "mmc-file-card-size", text: sizeLabel });
  card.addEventListener("click", (event) => {
    event.stopPropagation();
    options.onOpen();
  });
  const onContextMenu = options.onContextMenu;
  if (onContextMenu) {
    card.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onContextMenu(event);
    });
  }
  return card;
}
