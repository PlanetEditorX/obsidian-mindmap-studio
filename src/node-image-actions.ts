/**
 * @file node-image-actions.ts
 * @description 节点编辑器中的本地图片保存、图床上传和镜像合并操作。
 */

import { App, Notice } from "obsidian";
import type { MindMapImageContentBlock } from "./model";
import type { MindMapEditorCallbacks } from "./editor-types";
import { chooseImageHosts } from "./editor-modals";

/**
 * 节点图片操作所需的最小宿主服务集合。
 */
type NodeImageCallbacks = Pick<
  MindMapEditorCallbacks,
  "onSavePastedImage"
  | "getImageHosts"
  | "getDefaultUploadHostIds"
  | "onUploadImage"
  | "onReadImageSource"
>;

/**
 * 打开系统图片选择器。
 *
 * @returns 用户选择的图片文件；取消时返回 null。
 */
function selectImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
    input.click();
  });
}

/**
 * 选择图片并保存到仓库或上传到图床。
 *
 * @param app Obsidian 应用实例。
 * @param block 要更新的图片内容块。
 * @param mode 本地保存或远程上传模式。
 * @param callbacks 图片存储服务。
 * @returns 图片块是否发生变化。
 */
export async function selectNodeImage(
  app: App,
  block: MindMapImageContentBlock,
  mode: "local" | "remote",
  callbacks: NodeImageCallbacks
): Promise<boolean> {
  try {
    let hostIds: string[] = [];
    if (mode === "remote") {
      const chosen = await chooseImageHosts(app, callbacks.getImageHosts(), callbacks.getDefaultUploadHostIds());
      if (!chosen) return false;
      hostIds = chosen;
    }
    const file = await selectImageFile();
    if (!file) return false;
    if (mode === "local") {
      const path = await callbacks.onSavePastedImage(file, file.name);
      block.source = path;
      block.localSource = path;
      block.remoteSources = undefined;
    } else {
      const batch = await callbacks.onUploadImage(file, file.name, hostIds);
      if (!batch.successes.length) {
        const message = batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；") || "未知错误";
        throw new Error(message);
      }
      const uploadedAt = new Date().toISOString();
      block.source = batch.successes[0]!.url;
      block.localSource = undefined;
      block.remoteSources = batch.successes.map((item) => ({ ...item, uploadedAt }));
      if (batch.failures.length) {
        new Notice(`部分图床上传失败：${batch.failures.map((item) => item.hostName).join("、")}`, 7000);
      } else {
        new Notice(`已上传到：${batch.successes.map((item) => item.hostName).join("、")}`);
      }
    }
    if (!block.alt) block.alt = file.name.replace(/\.[^.]+$/, "");
    return true;
  } catch (error) {
    console.error("MindMap Studio image operation failed", error);
    new Notice(`${mode === "remote" ? "上传图床" : "保存图片"}失败：${error instanceof Error ? error.message : String(error)}`, 7000);
    return false;
  }
}

/**
 * 上传图片块当前指向的本地图片，并合并已有远程镜像。
 *
 * @param app Obsidian 应用实例。
 * @param block 要更新的图片内容块。
 * @param callbacks 图片存储服务。
 * @returns 图片块是否发生变化。
 */
export async function uploadCurrentNodeImage(
  app: App,
  block: MindMapImageContentBlock,
  callbacks: NodeImageCallbacks
): Promise<boolean> {
  try {
    const chosen = await chooseImageHosts(app, callbacks.getImageHosts(), callbacks.getDefaultUploadHostIds());
    if (!chosen) return false;
    const readableSource = block.localSource || block.source;
    const image = await callbacks.onReadImageSource(readableSource);
    if (!image) {
      new Notice("当前图片不是可读取的本地文件；请使用‘上传到图床’重新选择图片");
      return false;
    }
    const batch = await callbacks.onUploadImage(image.blob, image.suggestedName, chosen);
    if (!batch.successes.length) {
      throw new Error(batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；") || "上传失败");
    }
    const uploadedAt = new Date().toISOString();
    const existing = new Map((block.remoteSources ?? []).map((item) => [item.hostId, item]));
    batch.successes.forEach((item) => existing.set(item.hostId, { ...item, uploadedAt }));
    block.remoteSources = Array.from(existing.values());
    block.localSource = readableSource;
    if (!batch.failures.length) block.source = batch.successes[0]!.url;
    if (batch.failures.length) {
      new Notice(`部分图床上传失败，本地图片已保留：${batch.failures.map((item) => item.hostName).join("、")}`, 7000);
    } else {
      new Notice(`当前图片已上传到：${batch.successes.map((item) => item.hostName).join("、")}`);
    }
    return true;
  } catch (error) {
    console.error("MindMap Studio existing image upload failed", error);
    new Notice(`上传当前图片失败：${error instanceof Error ? error.message : String(error)}`, 7000);
    return false;
  }
}
