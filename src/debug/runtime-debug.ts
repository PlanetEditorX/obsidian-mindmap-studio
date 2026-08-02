/**
 * @file runtime-debug.ts
 * @description Bounded in-memory diagnostic log for navigation and user-interaction debugging.
 */

export interface RuntimeDebugEntry {
  sequence: number;
  time: string;
  elapsedMs: number;
  scope: string;
  event: string;
  details?: unknown;
}

const MAX_ENTRIES = 5000;
const MAX_STRING_LENGTH = 800;
const MAX_ARRAY_LENGTH = 40;
const MAX_OBJECT_KEYS = 60;
const MAX_DEPTH = 5;

/** Converts runtime values into JSON-safe, bounded diagnostic details without copying document content. */
function sanitizeDebugValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  if (typeof value === "bigint") return String(value);
  if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;
  if (typeof value !== "object") return String(value);
  if (depth >= MAX_DEPTH) return "[max-depth]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.slice(0, MAX_STRING_LENGTH),
      stack: value.stack?.split("\n").slice(0, 12).join("\n")
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeDebugValue(item, depth + 1, seen));
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
    result[key] = sanitizeDebugValue(item, depth + 1, seen);
  }
  return result;
}

/** Describes an event target without recording editable text or document body content. */
export function describeDebugTarget(target: EventTarget | null): Record<string, unknown> | null {
  if (!(target instanceof Element)) return null;
  const element = target instanceof HTMLElement ? target : target.parentElement;
  if (!element) return null;
  const editable = element.closest<HTMLElement>("input, textarea, [contenteditable='true']");
  const owner = element.closest<HTMLElement>("[data-node-id], [data-file-path], button, a, input, textarea, [role]") ?? element;
  return {
    tag: owner.tagName.toLowerCase(),
    id: owner.id || undefined,
    classes: Array.from(owner.classList).slice(0, 12),
    role: owner.getAttribute("role") || undefined,
    nodeId: owner.dataset.nodeId,
    filePath: owner.dataset.filePath,
    blockId: owner.dataset.blockId,
    editable: Boolean(editable)
  };
}

/** Keeps one bounded diagnostic session in memory and exports it as line-delimited JSON. */
export class RuntimeDebugLog {
  private enabled = false;
  private sequence = 0;
  private startedAt = Date.now();
  private sessionId = "";
  private readonly entries: RuntimeDebugEntry[] = [];
  private readonly throttleTimes = new Map<string, number>();

  /** Enables or disables collection. Enabling starts a fresh session. */
  setEnabled(enabled: boolean, reason = "settings"): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.entries.splice(0);
      this.throttleTimes.clear();
      this.sequence = 0;
      this.startedAt = Date.now();
      this.sessionId = `${new Date(this.startedAt).toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
      this.log("debug", "session-start", { reason });
    }
  }

  /** Returns whether the current session accepts events. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Appends one bounded structured event. */
  log(scope: string, event: string, details?: unknown): void {
    if (!this.enabled) return;
    const now = Date.now();
    const entry: RuntimeDebugEntry = {
      sequence: ++this.sequence,
      time: new Date(now).toISOString(),
      elapsedMs: now - this.startedAt,
      scope,
      event,
      ...(details === undefined ? {} : { details: sanitizeDebugValue(details) })
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) this.entries.splice(0, this.entries.length - MAX_ENTRIES);
  }

  /** Appends an event no more frequently than the requested interval for the same key. */
  logThrottled(key: string, intervalMs: number, scope: string, event: string, details?: unknown): void {
    if (!this.enabled) return;
    const now = Date.now();
    const previous = this.throttleTimes.get(key) ?? 0;
    if (now - previous < intervalMs) return;
    this.throttleTimes.set(key, now);
    this.log(scope, event, details);
  }

  /** Exports the complete current session with environment and active-view metadata. */
  exportText(metadata: Record<string, unknown>): string {
    const header = {
      format: "mindmap-studio-debug-log/v1",
      sessionId: this.sessionId || "not-started",
      enabled: this.enabled,
      exportedAt: new Date().toISOString(),
      entryCount: this.entries.length,
      metadata: sanitizeDebugValue(metadata)
    };
    return [JSON.stringify(header), ...this.entries.map((entry) => JSON.stringify(entry))].join("\n");
  }

  /** Number of retained events in the current session. */
  size(): number {
    return this.entries.length;
  }
}
