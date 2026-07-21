import type { App, TFile } from "obsidian";
import { documentToSvg } from "./layout";
import { mergeAppearance, parseDocument, type MindMapAppearance, type MindMapDocument } from "./model";

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

export function renderStaticSource(container: HTMLElement, source: string, fallbackTitle: string, defaultAppearance?: MindMapAppearance): void {
  renderStaticMindMap(container, parseDocument(source, fallbackTitle), { defaultAppearance });
}
