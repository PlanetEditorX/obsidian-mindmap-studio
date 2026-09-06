/** @file viewport-controller.ts
 * @description 导图画布视口控制器：持有缩放/平移状态与双指手势，提供变换、适应视图和动画能力。
 */

/** 双指手势的初始状态快照。 */
export interface TouchGestureState {
  centerX: number;
  centerY: number;
  distance: number;
  zoom: number;
  panX: number;
  panY: number;
}

/** fit-to-view 使用的当前布局边界。 */
export interface ViewportLayoutBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** 视口控制器操作的画布元素集合。 */
export interface ViewportControllerElements {
  viewportEl: HTMLElement;
  sceneEl: HTMLElement;
  rootEl: HTMLElement;
}

/**
 * 持有导图画布的缩放、平移与双指手势状态，并把变换应用到场景元素。
 *
 * 状态经编辑器的存取器转发，交互监听仍由编辑器注册（与选区逻辑交织），
 * 因此本类只承载可独立推导的变换机制。
 */
export class ViewportController {
  zoom = 1;
  panX = 0;
  panY = 0;
  mindMapViewportInitialized = false;
  touchGesture: TouchGestureState | null = null;
  readonly touchPointers = new Map<number, { x: number; y: number }>();
  viewportAnimationFrame: number | null = null;
  /** 工具栏缩放百分比输入框；创建后由编辑器回填。 */
  zoomStatusEl: HTMLInputElement | null = null;
  private elements: ViewportControllerElements | null = null;

  /** 在画布元素创建完成后由编辑器调用一次。 */
  attach(elements: ViewportControllerElements): void {
    this.elements = elements;
  }

  /** 把当前缩放与平移应用到场景元素并同步缩放输入框。 */
  applyTransform(): void {
    if (!this.elements) return;
    const rect = this.elements.viewportEl.getBoundingClientRect();
    this.elements.sceneEl.style.transform = `translate(${rect.width / 2 + this.panX}px, ${rect.height / 2 + this.panY}px) scale(${this.zoom})`;
    this.elements.rootEl.style.setProperty("--mmc-zoom", String(this.zoom));
    if (this.zoomStatusEl) this.zoomStatusEl.value = `${Math.round(this.zoom * 100)}%`;
  }

  /** 自适应当前布局边界，让整棵导图尽量铺满画布。 */
  fitToView(layout: ViewportLayoutBounds, animated = true): void {
    if (!this.elements) return;
    const rect = this.elements.viewportEl.getBoundingClientRect();
    const width = Math.max(1, layout.maxX - layout.minX + 100);
    const height = Math.max(1, layout.maxY - layout.minY + 100);
    const targetZoom = this.clampZoom(Math.min((rect.width - 40) / width, (rect.height - 40) / height, 1.25));
    const centerX = (layout.minX + layout.maxX) / 2;
    const centerY = (layout.minY + layout.maxY) / 2;
    const targetPanX = -centerX * targetZoom;
    const targetPanY = -centerY * targetZoom;
    this.mindMapViewportInitialized = true;
    this.animateViewportTo(targetZoom, targetPanX, targetPanY, animated);
  }

  /** Smoothly interpolates the canvas transform instead of jumping to its destination. */
  animateViewportTo(targetZoom: number, targetPanX: number, targetPanY: number, animated = true): void {
    if (this.viewportAnimationFrame !== null) window.cancelAnimationFrame(this.viewportAnimationFrame);
    this.viewportAnimationFrame = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startZoom = this.zoom;
    const startPanX = this.panX;
    const startPanY = this.panY;
    const distance = Math.hypot(targetPanX - startPanX, targetPanY - startPanY);
    const zoomDistance = Math.abs(targetZoom - startZoom);
    if (!animated || reducedMotion || (distance < 1 && zoomDistance < 0.002)) {
      this.zoom = targetZoom;
      this.panX = targetPanX;
      this.panY = targetPanY;
      this.applyTransform();
      return;
    }
    const startedAt = performance.now();
    const duration = Math.min(520, Math.max(260, 260 + distance * 0.08 + zoomDistance * 120));
    const ease = (value: number): number => 1 - Math.pow(1 - value, 3);
    const step = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = ease(progress);
      this.zoom = startZoom + (targetZoom - startZoom) * eased;
      this.panX = startPanX + (targetPanX - startPanX) * eased;
      this.panY = startPanY + (targetPanY - startPanY) * eased;
      this.applyTransform();
      if (progress < 1) {
        this.viewportAnimationFrame = window.requestAnimationFrame(step);
      } else {
        this.viewportAnimationFrame = null;
      }
    };
    this.viewportAnimationFrame = window.requestAnimationFrame(step);
  }

  /** 更新并应用zoom。 */
  setZoom(value: number): void {
    this.zoom = this.clampZoom(value);
    this.mindMapViewportInitialized = true;
    this.applyTransform();
  }

  /** 解析工具栏中的缩放百分比输入，并将有效值应用到画布。 */
  applyZoomInput(): void {
    if (!this.zoomStatusEl) return;
    const percent = Number(this.zoomStatusEl.value.trim().replace(/%$/, ""));
    if (!Number.isFinite(percent) || percent <= 0) {
      this.applyTransform();
      return;
    }
    this.setZoom(percent / 100);
  }

  /** 记录当前双指手势的初始中心点、间距和画布位置。 */
  beginTwoFingerGesture(): void {
    const [first, second] = Array.from(this.touchPointers.values());
    if (!first || !second) return;
    this.touchGesture = {
      centerX: (first.x + second.x) / 2,
      centerY: (first.y + second.y) / 2,
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      zoom: this.zoom,
      panX: this.panX,
      panY: this.panY
    };
  }

  /** 按设置将双指手势解释为缩放或画布平移。 */
  updateTwoFingerGesture(twoFingerGestureAction: "zoom" | "pan"): void {
    if (!this.elements) return;
    if (!this.touchGesture) this.beginTwoFingerGesture();
    const gesture = this.touchGesture;
    const [first, second] = Array.from(this.touchPointers.values());
    if (!gesture || !first || !second) return;
    const centerX = (first.x + second.x) / 2;
    const centerY = (first.y + second.y) / 2;
    if (twoFingerGestureAction === "pan") {
      this.panX = gesture.panX + centerX - gesture.centerX;
      this.panY = gesture.panY + centerY - gesture.centerY;
      this.mindMapViewportInitialized = true;
      this.applyTransform();
      return;
    }

    const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
    const nextZoom = this.clampZoom(gesture.zoom * distance / gesture.distance);
    const rect = this.elements.viewportEl.getBoundingClientRect();
    const initialX = gesture.centerX - rect.left - rect.width / 2;
    const initialY = gesture.centerY - rect.top - rect.height / 2;
    const worldX = (initialX - gesture.panX) / gesture.zoom;
    const worldY = (initialY - gesture.panY) / gesture.zoom;
    const currentX = centerX - rect.left - rect.width / 2;
    const currentY = centerY - rect.top - rect.height / 2;
    this.zoom = nextZoom;
    this.panX = currentX - worldX * nextZoom;
    this.panY = currentY - worldY * nextZoom;
    this.mindMapViewportInitialized = true;
    this.applyTransform();
  }

  /** 限制缩放倍率在支持范围内。 */
  clampZoom(value: number): number {
    return Math.min(2.5, Math.max(0.2, value));
  }
}
