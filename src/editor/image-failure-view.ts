/**
 * @file image-failure-view.ts
 * @description 为导图、大纲、文章和通读模式提供统一的图片加载失败地址卡片。
 */

import { Notice } from "obsidian";
import { imageSourceCandidates, type MindMapImageContentBlock } from "../core/model";

/**
 * 返回图片块所有可诊断地址，按当前图床优先级排序并去重。
 *
 * @param block 需要诊断的图片内容块。
 * @param imageHostPriorityIds 已启用图床从高到低的优先级。
 */
export function imageFailureSources(block: MindMapImageContentBlock, imageHostPriorityIds: string[] = []): string[] {
  const values = imageSourceCandidates(block, true, imageHostPriorityIds).map((candidate) => candidate.source.trim());
  if (block.source.trim()) values.push(block.source.trim());
  return Array.from(new Set(values.filter(Boolean)));
}

/**
 * 清除容器内已有的图片失败地址卡片，供重新尝试或镜像切换成功后复用。
 *
 * @param container 图片所在的内容块容器。
 */
export function clearImageFailureDetails(container: HTMLElement): void {
  container.querySelector(":scope > .mms-image-failure-card")?.remove();
}

/**
 * 在图片位置显示明确的失败状态、全部候选地址和复制操作。
 *
 * @param container 图片所在的内容块容器。
 * @param block 加载失败的图片内容块。
 * @param imageHostPriorityIds 已启用图床从高到低的优先级。
 */
export function renderImageFailureDetails(
  container: HTMLElement,
  block: MindMapImageContentBlock,
  imageHostPriorityIds: string[] = []
): HTMLElement {
  clearImageFailureDetails(container);
  const sources = imageFailureSources(block, imageHostPriorityIds);
  const card = container.createDiv({ cls: "mms-image-failure-card" });
  card.createDiv({ cls: "mms-image-failure-title", text: "图片加载失败" });
  card.createDiv({ cls: "mms-image-failure-description", text: "以下地址均无法加载，可复制后在浏览器或图床中检查。" });
  const list = card.createDiv({ cls: "mms-image-failure-addresses" });
  for (const source of sources.length ? sources : ["未保存图片地址"]) {
    const row = list.createDiv({ cls: "mms-image-failure-address" });
    const value = row.createEl("code", { text: source });
    value.setAttr("title", source);
    if (source === "未保存图片地址") continue;
    const copy = row.createEl("button", {
      cls: "clickable-icon mms-image-failure-copy",
      text: "复制地址",
      attr: { type: "button", "aria-label": `复制图片地址：${source}` }
    });
    copy.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void navigator.clipboard.writeText(source).then(
        () => new Notice("图片地址已复制"),
        () => new Notice("复制图片地址失败")
      );
    });
  }
  return card;
}

/**
 * 依次尝试图片块的远程镜像和本地来源，全部失败时显示地址卡片。
 *
 * @param image 实际承载图片的元素。
 * @param container 图片失败卡片所在容器。
 * @param block 需要加载的图片内容块。
 * @param imageHostPriorityIds 已启用图床从高到低的优先级。
 * @param resolveImage 将仓库路径或远程地址解析为浏览器可加载地址的回调。
 * @param onResolved 成功加载后接收原始候选地址与解析地址。
 */
export function loadImageWithFallback(
  image: HTMLImageElement,
  container: HTMLElement,
  block: MindMapImageContentBlock,
  imageHostPriorityIds: string[],
  resolveImage: (source: string) => string | null,
  onResolved?: (source: string, resolved: string) => void
): void {
  const candidates = imageSourceCandidates(block, true, imageHostPriorityIds);
  let index = 0;
  const attempt = (): void => {
    const candidate = candidates[index++];
    if (!candidate) {
      image.removeAttribute("src");
      image.addClass("is-hidden");
      renderImageFailureDetails(container, block, imageHostPriorityIds);
      return;
    }
    const resolved = resolveImage(candidate.source);
    if (!resolved) {
      attempt();
      return;
    }
    image.onload = () => {
      image.removeClass("is-hidden");
      clearImageFailureDetails(container);
      onResolved?.(candidate.source, resolved);
    };
    image.onerror = attempt;
    image.src = resolved;
  };
  attempt();
}
