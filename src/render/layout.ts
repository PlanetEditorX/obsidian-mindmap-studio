/**
 * @file layout.ts
 * @description 渲染领域的布局计算与 SVG 导出模块。
 *
 * 根据可见节点、自定义尺寸、布局方向和外观配置计算坐标、边界、连接线路径与层级线宽，并使用同一结果生成 SVG。
 */

import { nodeContentBlocks, nodePlainText, type EdgeStyle, type FontFamilyMode, type LayoutMode, type MindMapAppearance, type MindMapNode, type MindMapTextRun, type NodeShape, type NodeVisualStyle } from "../core/model";
import { resolveLayoutCollisions } from "./collision-layout";

/**
 * NodePosition 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface NodePosition {
  node: MindMapNode;
  parentId: string | null;
  x: number;
  y: number;
  depth: number;
  side: -1 | 0 | 1;
  width: number;
  height: number;
}

/**
 * LayoutResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface LayoutResult {
  nodes: NodePosition[];
  byId: Map<string, NodePosition>;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const ROOT_WIDTH = 196;
const NODE_WIDTH = 176;
const H_GAP = 112;
const V_GAP = 24;

/**
 * 执行“visible children”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 按当前规则构建的集合结果。
 */
function visibleChildren(node: MindMapNode): MindMapNode[] {
  return node.collapsed ? [] : node.children;
}

/**
 * 执行“estimated text lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param width 该参数用于 estimated text lines 流程中的输入或控制。
 * @param fontSize 该参数用于 estimated text lines 流程中的输入或控制。
 * @returns 计算得到的数值结果。
 */
function estimatedTextLines(text: string, width: number, fontSize: number): number {
  const available = Math.max(44, width - 48);
  const averageGlyphWidth = Math.max(5.5, fontSize * 0.62);
  const charsPerLine = Math.max(4, Math.floor(available / averageGlyphWidth));
  return Math.max(1, text.split(/\r?\n/).reduce((sum, line) => sum + Math.max(1, Math.ceil(Math.max(1, line.length) / charsPerLine)), 0));
}

/**
 * 执行“node dimensions”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 * @returns 计算得到的数值结果。
 */
function nodeDimensions(node: MindMapNode, depth: number, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance = {}): { width: number; height: number } {
  const fontSize = node.style?.fontSize ?? defaultFontSize;
  const manualWidth = node.style?.width;
  const extraWidth = Math.max(0, fontSize - 14) * 4;
  const blocks = nodeContentBlocks(node);
  const fitted = visualStyle === "branch";
  const fixedWidth = Math.max(100, Math.min(900, appearance.defaultNodeWidth ?? NODE_WIDTH));
  const automatic = appearance.nodeWidthMode !== "fixed";
  const automaticMaximum = Math.max(120, Math.min(900, appearance.autoNodeMaxWidth ?? 460));
  let width = manualWidth ?? (!automatic
    ? fixedWidth
    : fitted
      ? ((depth === 0 ? 146 : 92) + extraWidth)
      : ((depth === 0 ? ROOT_WIDTH : NODE_WIDTH) + extraWidth));

  if (!manualWidth && automatic) {
    for (const block of blocks) {
      if (block.type === "image") width = Math.max(width, 240);
      else {
        const longestLine = Math.max(1, ...block.text.split(/\r?\n/).map((line) => line.length));
        const visualUnits = Array.from(block.text.split(/\r?\n/).sort((a, b) => b.length - a.length)[0] ?? "")
          .reduce((sum, character) => sum + (/[\u2e80-\u9fff\uff00-\uffef]/u.test(character) ? 1 : .62), 0);
        const horizontalPadding = fitted ? (depth === 0 ? 48 : 58) : 80;
        width = Math.max(width, Math.min(automaticMaximum, horizontalPadding + Math.min(visualUnits, 90) * fontSize));
      }
    }
    if (node.table) {
      const columns = Math.max(1, node.table.headers.length);
      width = Math.min(720, Math.max(300, columns * 124));
    }
    if (node.code) {
      const lines = node.code.code.split(/\r?\n/);
      const longest = Math.max(20, ...lines.slice(0, 80).map((line) => line.length));
      width = Math.min(720, Math.max(380, longest * 7.2 + 42));
    }
  }

  if (!manualWidth && automatic) width = Math.min(width, automaticMaximum);
  width = Math.min(900, Math.max(fitted ? 80 : 100, width));
  let height = 28 + Math.max(0, fontSize - 14) * 1.4;
  if (!blocks.length) height += depth === 0 ? 34 : 26;
  for (const block of blocks) {
    if (block.type === "image") height += 132;
    else height += Math.max(30, estimatedTextLines(block.text, width, fontSize) * (fontSize + 8));
  }
  if (node.tags?.length) height += 20;
  if (node.table) {
    const visibleRows = Math.min(10, node.table.rows.length);
    height += 42 + visibleRows * 31 + (node.table.rows.length > visibleRows ? 24 : 0);
  }
  if (node.code) {
    const lines = node.code.code.split(/\r?\n/);
    height += Math.min(390, Math.max(100, Math.min(lines.length, 18) * 20 + 48));
  }
  height = Math.max(height, node.style?.minHeight ?? 0);
  return { width, height: Math.min(1200, height) };
}

/**
 * 执行“subtree height”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 * @returns 计算得到的数值结果。
 */
function subtreeHeight(node: MindMapNode, depth: number, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance = {}): number {
  const ownHeight = nodeDimensions(node, depth, defaultFontSize, visualStyle, appearance).height;
  const children = visibleChildren(node);
  if (!children.length) return ownHeight;
  const verticalGap = visualStyle === "branch" ? 18 : V_GAP;
  const childrenHeight = children.reduce((sum, child) => sum + subtreeHeight(child, depth + 1, defaultFontSize, visualStyle, appearance), 0) + verticalGap * (children.length - 1);
  return Math.max(ownHeight, childrenHeight);
}

/**
 * 执行“layout branch”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @param parentId 该参数用于 layout branch 流程中的输入或控制。
 * @param parentX 该参数用于 layout branch 流程中的输入或控制。
 * @param parentWidth 该参数用于 layout branch 流程中的输入或控制。
 * @param side 该参数用于 layout branch 流程中的输入或控制。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param centerY 该参数用于 layout branch 流程中的输入或控制。
 * @param output 该参数用于 layout branch 流程中的输入或控制。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 */
function layoutBranch(
  node: MindMapNode,
  parentId: string,
  parentX: number,
  parentWidth: number,
  side: -1 | 1,
  depth: number,
  centerY: number,
  output: NodePosition[],
  defaultFontSize = 14,
  visualStyle: NodeVisualStyle = "card",
  appearance: MindMapAppearance = {}
): void {
  const dimensions = nodeDimensions(node, depth, defaultFontSize, visualStyle, appearance);
  const horizontalGap = visualStyle === "branch" ? 54 : H_GAP;
  const verticalGap = visualStyle === "branch" ? 18 : V_GAP;
  const x = parentX + side * (parentWidth / 2 + horizontalGap + dimensions.width / 2);
  output.push({ node, parentId, x, y: centerY, depth, side, ...dimensions });
  const children = visibleChildren(node);
  if (!children.length) return;

  const heights = children.map((child) => subtreeHeight(child, depth + 1, defaultFontSize, visualStyle, appearance));
  const totalHeight = heights.reduce((sum, childHeight) => sum + childHeight, 0) + verticalGap * (children.length - 1);
  let cursor = centerY - totalHeight / 2;
  children.forEach((child, index) => {
    const childHeight = heights[index] ?? nodeDimensions(child, depth + 1, defaultFontSize, visualStyle, appearance).height;
    const childCenter = cursor + childHeight / 2;
    layoutBranch(child, node.id, x, dimensions.width, side, depth + 1, childCenter, output, defaultFontSize, visualStyle, appearance);
    cursor += childHeight + verticalGap;
  });
}

/**
 * 计算当前可见节点的尺寸、坐标、深度和整体边界。折叠节点的后代不会参与布局；节点自定义宽度和最小高度会直接影响子树占位与连接线端点。
 *
 * @param root 节点树的根节点。
 * @param mode 当前布局或显示模式。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 * @returns 当前操作生成、查找或规范化后的结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function computeLayout(root: MindMapNode, mode: LayoutMode, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance = {}): LayoutResult {
  const rootDimensions = nodeDimensions(root, 0, defaultFontSize, visualStyle, appearance);
  const verticalGap = visualStyle === "branch" ? 18 : V_GAP;
  const nodes: NodePosition[] = [
    { node: root, parentId: null, x: 0, y: 0, depth: 0, side: 0, ...rootDimensions }
  ];
  const children = visibleChildren(root);

  if (mode === "balanced" && children.length > 1) {
    const left: MindMapNode[] = [];
    const right: MindMapNode[] = [];
    let leftHeight = 0;
    let rightHeight = 0;
    for (const child of [...children].sort((a, b) => subtreeHeight(b, 1, defaultFontSize, visualStyle, appearance) - subtreeHeight(a, 1, defaultFontSize, visualStyle, appearance))) {
      const height = subtreeHeight(child, 1, defaultFontSize, visualStyle, appearance) + verticalGap;
      if (leftHeight <= rightHeight) {
        left.push(child);
        leftHeight += height;
      } else {
        right.push(child);
        rightHeight += height;
      }
    }

    const placeSide = (items: MindMapNode[], side: -1 | 1): void => {
      const heights = items.map((child) => subtreeHeight(child, 1, defaultFontSize, visualStyle, appearance));
      const total = heights.reduce((sum, value) => sum + value, 0) + verticalGap * Math.max(0, items.length - 1);
      let cursor = -total / 2;
      items.forEach((child, index) => {
        const height = heights[index] ?? nodeDimensions(child, 1, defaultFontSize, visualStyle, appearance).height;
        layoutBranch(child, root.id, 0, rootDimensions.width, side, 1, cursor + height / 2, nodes, defaultFontSize, visualStyle, appearance);
        cursor += height + verticalGap;
      });
    };
    placeSide(left, -1);
    placeSide(right, 1);
  } else {
    const heights = children.map((child) => subtreeHeight(child, 1, defaultFontSize, visualStyle, appearance));
    const total = heights.reduce((sum, value) => sum + value, 0) + verticalGap * Math.max(0, children.length - 1);
    let cursor = -total / 2;
    children.forEach((child, index) => {
      const height = heights[index] ?? nodeDimensions(child, 1, defaultFontSize, visualStyle, appearance).height;
      layoutBranch(child, root.id, 0, rootDimensions.width, 1, 1, cursor + height / 2, nodes, defaultFontSize, visualStyle, appearance);
      cursor += height + verticalGap;
    });
  }

  resolveLayoutCollisions(nodes, verticalGap);
  const byId = new Map(nodes.map((position) => [position.node.id, position]));
  const minX = Math.min(...nodes.map((position) => position.x - position.width / 2));
  const maxX = Math.max(...nodes.map((position) => position.x + position.width / 2));
  const minY = Math.min(...nodes.map((position) => position.y - position.height / 2));
  const maxY = Math.max(...nodes.map((position) => position.y + position.height / 2));
  return { nodes, byId, minX, maxX, minY, maxY };
}


/**
 * 构建branch color map，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param colors 该参数用于 build branch color map 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function buildBranchColorMap(root: MindMapNode, colors: string[] | undefined): Map<string, string> {
  const result = new Map<string, string>();
  if (!colors?.length) return result;
  const visit = (node: MindMapNode, color: string): void => {
    result.set(node.id, color);
    node.children.forEach((child) => visit(child, color));
  };
  root.children.forEach((child, index) => visit(child, colors[index % colors.length]!));
  return result;
}

/**
 * 根据连接线模式计算指定层级的线宽。统一模式始终返回起始宽度；渐细模式会按当前实际最大深度插值，并保证最深层达到最小宽度。
 *
 * @param appearance 导图外观配置。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param maxDepth 当前可见树的最大层级，用于归一化计算。
 * @returns 计算得到的数值结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function edgeWidthForDepth(appearance: MindMapAppearance, depth: number, maxDepth = 5): number {
  const maximum = Math.max(0.5, Math.min(8, appearance.edgeWidth ?? 2.2));
  if (appearance.edgeWidthMode !== "tapered") return maximum;
  const minimum = Math.max(0.25, Math.min(maximum, appearance.edgeMinWidth ?? Math.min(1, maximum)));
  const deepest = Math.max(1, Math.floor(maxDepth));
  // The first edge stays at the configured maximum. The deepest visible edge
  // reaches the configured minimum, so tapering remains obvious even in a
  // shallow two- or three-level map.
  const progress = deepest <= 1 ? 0 : Math.min(1, Math.max(0, depth - 1) / (deepest - 1));
  return Number((maximum + (minimum - maximum) * progress).toFixed(3));
}

/**
 * 执行“edge path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param parent 当前节点的父节点；根节点场景可能为空。
 * @param child 该参数用于 edge path 流程中的输入或控制。
 * @param style 要应用、比较或规范化的样式。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function edgePath(parent: NodePosition, child: NodePosition, style: EdgeStyle = "curved"): string {
  const parentX = parent.x + (child.side >= 0 ? parent.width / 2 : -parent.width / 2);
  const childX = child.x - (child.side >= 0 ? child.width / 2 : -child.width / 2);
  if (style === "straight") return `M ${parentX} ${parent.y} L ${childX} ${child.y}`;
  const middleX = parentX + (childX - parentX) * 0.5;
  if (style === "elbow") return `M ${parentX} ${parent.y} L ${middleX} ${parent.y} L ${middleX} ${child.y} L ${childX} ${child.y}`;
  return `M ${parentX} ${parent.y} C ${middleX} ${parent.y}, ${middleX} ${child.y}, ${childX} ${child.y}`;
}

/**
 * Builds an orthogonal branch with rounded corners for the rounded-branch
 * visual style without relying on external assets.
 *
 * @param parent Parent node layout.
 * @param child Child node layout.
 * @returns SVG path data for a rounded elbow connector.
 */
export function roundedElbowEdgePath(parent: NodePosition, child: NodePosition): string {
  const parentX = parent.x + (child.side >= 0 ? parent.width / 2 : -parent.width / 2);
  const childX = child.x - (child.side >= 0 ? child.width / 2 : -child.width / 2);
  const middleX = parentX + (childX - parentX) * .5;
  const deltaY = child.y - parent.y;
  if (Math.abs(deltaY) < .5) return `M ${parentX} ${parent.y} L ${childX} ${child.y}`;
  const directionX = Math.sign(childX - parentX) || 1;
  const directionY = Math.sign(deltaY);
  const radius = Math.min(16, Math.abs(childX - parentX) / 4, Math.abs(deltaY) / 2);
  return [
    `M ${parentX} ${parent.y}`,
    `L ${middleX - directionX * radius} ${parent.y}`,
    `Q ${middleX} ${parent.y} ${middleX} ${parent.y + directionY * radius}`,
    `L ${middleX} ${child.y - directionY * radius}`,
    `Q ${middleX} ${child.y} ${middleX + directionX * radius} ${child.y}`,
    `L ${childX} ${child.y}`
  ].join(" ");
}

/**
 * 转义xml，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" };
    return entities[character] ?? character;
  });
}

/**
 * 执行“valid color”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param fallback 该参数用于 valid color 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function validColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/**
 * 执行“svg radius”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param shape 该参数用于 svg radius 流程中的输入或控制。
 * @returns 计算得到的数值结果。
 */
function svgRadius(shape: NodeShape | undefined): number {
  if (shape === "rectangle") return 3;
  if (shape === "pill") return 28;
  return 14;
}

/**
 * 执行“task glyph”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function taskGlyph(node: MindMapNode): string {
  if (node.task === "done") return "✓ ";
  if (node.task === "doing") return "◐ ";
  if (node.task === "todo") return "○ ";
  return "";
}

/**
 * 执行“truncate runs”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param maxLength 该参数用于 truncate runs 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
function truncateRuns(runs: MindMapTextRun[], maxLength: number): MindMapTextRun[] {
  const result: MindMapTextRun[] = [];
  let remaining = maxLength;
  let truncated = false;
  for (const run of runs) {
    if (remaining <= 0) { truncated = true; break; }
    if (run.text.length <= remaining) {
      result.push({ text: run.text, style: run.style });
      remaining -= run.text.length;
      continue;
    }
    result.push({ text: run.text.slice(0, remaining), style: run.style });
    remaining = 0;
    truncated = true;
  }
  if (truncated && result.length) result[result.length - 1]!.text = `${result[result.length - 1]!.text.slice(0, -1)}…`;
  return result;
}

/**
 * 执行“rich text tspans”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text tspans 流程中的输入或控制。
 * @param prefix 该参数用于 rich text tspans 流程中的输入或控制。
 * @param foreground 该参数用于 rich text tspans 流程中的输入或控制。
 * @param maxChars 该参数用于 rich text tspans 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function richTextTspans(runs: MindMapTextRun[] | undefined, fallbackText: string, prefix: string, foreground: string, maxChars = 160): string {
  const source: MindMapTextRun[] = [
    ...(prefix ? [{ text: prefix }] : []),
    ...(runs?.length ? runs : [{ text: fallbackText }])
  ];
  return truncateRuns(source, maxChars).map((run) => {
    const style = run.style;
    const attributes: string[] = [];
    if (style?.color) attributes.push(`fill="${validColor(style.color, foreground)}"`);
    if (style?.bold !== undefined) attributes.push(`font-weight="${style.bold ? 700 : 400}"`);
    if (style?.italic !== undefined) attributes.push(`font-style="${style.italic ? "italic" : "normal"}"`);
    const decorations: string[] = [];
    if (style?.underline) decorations.push("underline");
    if (style?.strike) decorations.push("line-through");
    if (decorations.length) attributes.push(`text-decoration="${decorations.join(" ")}"`);
    return `<tspan ${attributes.join(" ")}>${escapeXml(run.text)}</tspan>`;
  }).join("");
}

/**
 * 执行“svg wrapped lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param width 该参数用于 svg wrapped lines 流程中的输入或控制。
 * @param fontSize 该参数用于 svg wrapped lines 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function svgWrappedLines(text: string, width: number, fontSize: number): string[] {
  const available = Math.max(44, width - 32);
  const maxChars = Math.max(4, Math.floor(available / Math.max(5.5, fontSize * .62)));
  const lines: string[] = [];
  for (const sourceLine of text.split(/\r?\n/)) {
    if (!sourceLine) { lines.push(""); continue; }
    for (let index = 0; index < sourceLine.length; index += maxChars) lines.push(sourceLine.slice(index, index + maxChars));
  }
  return lines.length ? lines : [""];
}

/**
 * 执行“svg font family”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param mode 当前布局或显示模式。
 * @param customFont 该参数用于 svg font family 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function svgFontFamily(mode: FontFamilyMode | undefined, customFont: string | undefined): string {
  if (mode === "serif") return 'Georgia,"Times New Roman",serif';
  if (mode === "mono") return '"SFMono-Regular",Consolas,"Liberation Mono",monospace';
  if (mode === "custom" && customFont?.trim()) return `"${customFont.trim().replaceAll('"', '')}",sans-serif`;
  return 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
}

/**
 * 使用与编辑画布一致的布局、文本对齐、节点尺寸、主题颜色、富文本和渐细连线生成独立 SVG 字符串。导出过程不依赖 DOM。
 *
 * @param root 节点树的根节点。
 * @param mode 当前布局或显示模式。
 * @param title 文档、节点或导出文件的显示标题。
 * @param appearance 导图外观配置。
 * @returns 计算、解析或序列化后的字符串结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function documentToSvg(root: MindMapNode, mode: LayoutMode, title: string, appearance: MindMapAppearance = {}): string {
  const defaultFontSize = appearance.fontSize ?? 14;
  const layout = computeLayout(root, mode, defaultFontSize, appearance.nodeVisualStyle ?? "card", appearance);
  const padding = 72;
  const width = Math.max(320, layout.maxX - layout.minX + padding * 2);
  const height = Math.max(220, layout.maxY - layout.minY + padding * 2);
  const offsetX = padding - layout.minX;
  const offsetY = padding - layout.minY;
  const edgeStyle = appearance.edgeStyle ?? "curved";
  const defaultEdge = validColor(appearance.edgeColor, "#7c8aa5");
  const branchColorMap = appearance.colorfulBranches ? buildBranchColorMap(root, appearance.branchColors) : new Map<string, string>();
  const maxDepth = Math.max(1, ...layout.nodes.map((position) => position.depth));
  const edges = layout.nodes
    .filter((position) => position.parentId)
    .map((position) => {
      const parent = position.parentId ? layout.byId.get(position.parentId) : undefined;
      const stroke = validColor(position.node.style?.color, branchColorMap.get(position.node.id) ?? defaultEdge);
      const width = edgeWidthForDepth(appearance, position.depth, maxDepth);
      if (!parent) return "";
      const path = appearance.nodeVisualStyle === "branch"
        ? roundedElbowEdgePath(parent, position)
        : edgePath(parent, position, edgeStyle);
      return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
    })
    .join("\n");

  const nodes = layout.nodes.map((position) => {
    const node = position.node;
    const x = position.x - position.width / 2;
    const y = position.y - position.height / 2;
    const isRoot = position.depth === 0;
    const defaultBackground = isRoot ? validColor(appearance.rootColor, "#4f46e5") : validColor(appearance.nodeColor, "#ffffff");
    const defaultText = isRoot ? validColor(appearance.rootTextColor, "#ffffff") : validColor(appearance.textColor, "#0f172a");
    const background = validColor(node.style?.color, defaultBackground);
    const foreground = validColor(node.style?.textColor, defaultText);
    const branchColor = branchColorMap.get(node.id);
    const border = validColor(node.style?.borderColor, isRoot ? background : branchColor ?? validColor(appearance.nodeBorderColor, "#94a3b8"));
    const borderWidth = node.style?.borderWidth ?? appearance.nodeBorderWidth ?? (isRoot ? 2 : 1);
    const prefix = `${node.icon ? `${node.icon} ` : ""}${taskGlyph(node)}`;
    const textAlign = node.style?.textAlign ?? appearance.nodeTextAlign ?? "center";
    const textAnchor = textAlign === "left" ? "start" : textAlign === "right" ? "end" : "middle";
    const textX = textAlign === "left" ? x + 16 : textAlign === "right" ? x + position.width - 16 : position.x;
    const contentBlocks = nodeContentBlocks(node);
    let contentY = y + 28;
    const contentParts: string[] = [];
    let prefixUsed = false;
    let submapMarkerUsed = false;
    for (const block of contentBlocks) {
      if (block.type === "image") {
        contentParts.push(`<rect x="${position.x - 70}" y="${contentY - 14}" width="140" height="94" rx="8" fill="rgba(127,127,127,.12)"/><text x="${position.x}" y="${contentY + 38}" text-anchor="middle" fill="${foreground}" font-size="12">🖼 ${escapeXml((block.alt ?? "图片").slice(0, 20))}</text>`);
        contentY += 112;
      } else if (block.text.trim()) {
        const blockPrefix = prefixUsed ? "" : prefix;
        prefixUsed = true;
        const suffix: string = node.submap && !submapMarkerUsed ? "  ↗" : "";
        submapMarkerUsed = submapMarkerUsed || Boolean(suffix);
        const fontSize = node.style?.fontSize ?? defaultFontSize;
        const plainText = `${blockPrefix}${block.text}${suffix}`;
        const lines = svgWrappedLines(plainText, position.width, fontSize);
        if (lines.length === 1) {
          const maxChars = Math.max(42, Math.floor((position.width - 32) / Math.max(5.5, fontSize * .62)));
          const submapSuffix = suffix ? `<tspan fill="${foreground}" opacity=".72">${escapeXml(suffix)}</tspan>` : "";
          contentParts.push(`<text x="${textX}" y="${contentY}" text-anchor="${textAnchor}" fill="${foreground}" font-size="${fontSize}">${richTextTspans(block.richText, block.text, blockPrefix, foreground, maxChars)}${submapSuffix}</text>`);
        } else {
          lines.forEach((line, index) => contentParts.push(`<text x="${textX}" y="${contentY + index * (fontSize + 8)}" text-anchor="${textAnchor}" fill="${foreground}" font-size="${fontSize}">${escapeXml(line)}</text>`));
        }
        contentY += lines.length * (fontSize + 8);
      }
    }
    if (!contentBlocks.length) {
      const fontSize = node.style?.fontSize ?? defaultFontSize;
      const lines = svgWrappedLines(`${prefix || nodePlainText(node) || "图片节点"}${node.submap ? "  ↗" : ""}`, position.width, fontSize);
      lines.forEach((line, index) => contentParts.push(`<text x="${textX}" y="${contentY + index * (fontSize + 8)}" text-anchor="${textAnchor}" fill="${foreground}" font-size="${fontSize}">${escapeXml(line)}</text>`));
    }
    let richY = contentY + 10;
    const richParts: string[] = [];
    if (node.table) {
      const rows = [node.table.headers, ...node.table.rows.slice(0, 8)];
      rows.forEach((row, index) => {
        const rowText = escapeXml(row.map((cell) => cell.replaceAll("\n", " ")).join("  |  ").slice(0, 100));
        richParts.push(`<text x="${x + 16}" y="${richY + index * 23}" fill="${foreground}" font-size="${index === 0 ? 10.5 : 9.5}" font-weight="${index === 0 ? 700 : 400}">${rowText}</text>`);
      });
      if (node.table.rows.length > 8) richParts.push(`<text x="${x + 16}" y="${richY + rows.length * 23}" fill="${foreground}" opacity=".65" font-size="9">… 还有 ${node.table.rows.length - 8} 行</text>`);
    }
    if (node.code) {
      richParts.push(`<rect x="${x + 12}" y="${richY - 14}" width="${position.width - 24}" height="${Math.min(350, Math.max(80, node.code.code.split(/\r?\n/).length * 17 + 34))}" rx="7" fill="rgba(15,23,42,.10)"/>`);
      richParts.push(`<text x="${x + 20}" y="${richY + 3}" fill="${foreground}" opacity=".7" font-size="9">${escapeXml(node.code.language || "code")}</text>`);
      node.code.code.split(/\r?\n/).slice(0, 16).forEach((line, index) => richParts.push(`<text x="${x + 20}" y="${richY + 23 + index * 17}" fill="${foreground}" font-size="9" font-family="monospace">${escapeXml(line.slice(0, 92))}</text>`));
    }
    const richContent = richParts.join("");
    const tags = node.tags?.length
      ? `<text x="${position.x}" y="${position.y + position.height / 2 - 9}" text-anchor="middle" fill="${foreground}" opacity=".72" font-size="10">${escapeXml(node.tags.map((tag) => `#${tag}`).join("  ").slice(0, 48))}</text>`
      : "";
    const bold = node.style?.bold ?? appearance.bold ?? false;
    const italic = node.style?.italic ?? appearance.italic ?? false;
    const underline = node.style?.underline ?? appearance.underline ?? false;
    const fontSize = node.style?.fontSize ?? defaultFontSize;
    return `<g><rect x="${x}" y="${y}" width="${position.width}" height="${position.height}" rx="${svgRadius(node.style?.shape)}" fill="${background}" stroke="${border}" stroke-width="${borderWidth}"/><g font-weight="${isRoot || bold ? 700 : 400}" font-style="${italic ? "italic" : "normal"}" text-decoration="${underline ? "underline" : "none"}">${contentParts.join("")}</g>${richContent}${tags}</g>`;
  }).join("\n");

  const background = validColor(appearance.backgroundColor, "#f8fafc");
  const patternColor = validColor(appearance.patternColor, "#94a3b8");
  const pattern = appearance.backgroundPattern ?? "none";
  const defs = pattern === "grid"
    ? `<defs><pattern id="mmc-pattern" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="${patternColor}" stroke-width="1" opacity=".18"/></pattern></defs><rect width="100%" height="100%" fill="url(#mmc-pattern)"/>`
    : pattern === "dots"
      ? `<defs><pattern id="mmc-pattern" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="${patternColor}" opacity=".28"/></pattern></defs><rect width="100%" height="100%" fill="url(#mmc-pattern)"/>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}">
<title>${escapeXml(title)}</title>
<style>svg{background:${background};font-family:${svgFontFamily(appearance.fontFamily, appearance.customFont)}}</style>
${defs}<g transform="translate(${offsetX} ${offsetY})">${edges}${nodes}</g>
</svg>`;
}
