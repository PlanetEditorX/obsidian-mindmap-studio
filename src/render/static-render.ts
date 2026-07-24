/**
 * @file static-render.ts
 * @description 渲染领域的 Markdown 只读导图入口。
 *
 * 复用模型和 SVG 导出逻辑，保证嵌入预览与可编辑视图的布局和主题尽量一致。
 */

import type { App, TFile } from "obsidian";
import { documentToSvg } from "./layout";
import { mergeAppearance, parseDocument, type MindMapAppearance, type MindMapDocument } from "../core/model";

/**
 * 渲染static mind map，并保持模型、界面和持久化状态的一致性。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param document 要处理的思维导图文档。
 * @param options 控制当前操作行为的可选配置。
 */
export function renderStaticMindMap(
  container: HTMLElement,
  document: MindMapDocument,
  options?: { app?: App; file?: TFile; maxHeight?: number; defaultAppearance?: MindMapAppearance }
): void {
  container.empty();
  container.addClass("mmc-static-preview");
  const svg = documentToSvg(document.root, document.layout, document.title, mergeAppearance(options?.defaultAppearance, document.appearance));
  const image = container.createEl("img", {
    attr: {
      alt: `${document.title} 思维导图预览`,
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }
  });
  if (options?.maxHeight) image.style.maxHeight = `${options.maxHeight}px`;
  if (options?.app && options.file) {
    image.addEventListener("dblclick", () => {
      void options.app?.workspace.getLeaf(false).openFile(options.file as TFile);
    });
    image.setAttr("title", "双击打开思维导图");
  }
}

/**
 * 渲染static source，并保持模型、界面和持久化状态的一致性。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param source 待解析或渲染的原始文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @param defaultAppearance 该参数用于 render static source 流程中的输入或控制。
 */
export function renderStaticSource(container: HTMLElement, source: string, fallbackTitle: string, defaultAppearance?: MindMapAppearance): void {
  renderStaticMindMap(container, parseDocument(source, fallbackTitle), { defaultAppearance });
}
