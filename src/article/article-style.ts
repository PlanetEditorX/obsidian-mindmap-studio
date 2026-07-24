/**
 * @file article-style.ts
 * @description 文章领域的样式预设与解析。
 */

import type { ArticleStyle, ArticleStylePresetId } from "../core/model";

export const ARTICLE_STYLE_PRESETS: Readonly<Record<ArticleStylePresetId, ArticleStyle>> = {
  classic: { preset: "classic", tocStyle: "card", fontSize: 16, lineHeight: 1.85 },
  book: { preset: "book", fontFamily: "Georgia, 'Noto Serif SC', serif", textColor: "#332b24", headingColor: "#241c16", accentColor: "#8b5e3c", backgroundColor: "#fffdf7", tocStyle: "lines", fontSize: 17, lineHeight: 2 },
  modern: { preset: "modern", fontFamily: "Inter, 'Microsoft YaHei', sans-serif", textColor: "#243247", headingColor: "#12213a", accentColor: "#2563eb", backgroundColor: "#f8fafc", tocStyle: "card", fontSize: 16, lineHeight: 1.75 },
  minimal: { preset: "minimal", fontFamily: "Arial, 'Microsoft YaHei', sans-serif", textColor: "#27272a", headingColor: "#18181b", accentColor: "#52525b", backgroundColor: "#ffffff", tocStyle: "plain", fontSize: 15, lineHeight: 1.8 }
};

/**
 * 解析文章样式预设，并叠加当前文档的自定义值。
 *
 * @param style 文档保存的文章样式。
 * @returns 可直接用于渲染的完整样式。
 */
export function resolveArticleStyle(style: ArticleStyle | undefined): ArticleStyle {
  const preset = style?.preset ?? "classic";
  return { ...ARTICLE_STYLE_PRESETS[preset], ...(style ?? {}), preset };
}
