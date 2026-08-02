/**
 * @file coalesced-json-writer.ts
 * @description 将短时间内重复触发的 JSON 持久化请求合并为串行写入，并保证等待方只在对应版本落盘后完成。
 */

/** 创建串行合并写入器所需的快照与持久化回调。 */
export interface CoalescedJsonWriterOptions<T> {
  /** 在真正开始一轮写入时获取最新的不可变快照。 */
  snapshot: () => T;
  /** 将一份快照写入持久层；同一写入器不会并发调用该函数。 */
  write: (snapshot: T) => Promise<void>;
  /** 首轮写入前用于吸收连续 UI 事件的短延迟。 */
  delayMs?: number;
}

/** 等待某一请求版本完成或失败的内部记录。 */
interface CoalescedJsonWriterWaiter {
  revision: number;
  resolve: () => void;
  reject: (error: unknown) => void;
}

/**
 * 合并连续保存请求，并在写入期间继续吸收新请求。
 *
 * 每轮只持久化开始写入时的最新状态；若写入期间状态再次变化，当前写入结束后
 * 会立即追加一轮最新快照，避免旧写入晚于新写入完成而覆盖较新的配置。
 */
export class CoalescedJsonWriter<T> {
  private readonly delayMs: number;
  private requestedRevision = 0;
  private persistedRevision = 0;
  private timer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private runner: Promise<void> | null = null;
  private readonly waiters: CoalescedJsonWriterWaiter[] = [];

  /** 保存回调与合并延迟，但不会在构造时发起写入。 */
  constructor(private readonly options: CoalescedJsonWriterOptions<T>) {
    this.delayMs = Math.max(0, Math.round(options.delayMs ?? 35));
  }

  /** 请求保存当前最新状态，并在包含本次请求的快照落盘后完成。 */
  request(): Promise<void> {
    const revision = ++this.requestedRevision;
    const completion = new Promise<void>((resolve, reject) => {
      this.waiters.push({ revision, resolve, reject });
    });
    this.schedule();
    return completion;
  }

  /** 取消等待延迟并立即完成当前所有待写版本，供卸载或测试收尾使用。 */
  async flush(): Promise<void> {
    if (this.timer !== null) {
      globalThis.clearTimeout(this.timer);
      this.timer = null;
    }
    this.startRunner();
    if (this.runner) await this.runner;
  }

  /** 在没有运行中任务时安排一次尾随写入。 */
  private schedule(): void {
    if (this.runner || this.timer !== null || this.persistedRevision >= this.requestedRevision) return;
    this.timer = globalThis.setTimeout(() => {
      this.timer = null;
      this.startRunner();
    }, this.delayMs);
  }

  /** 启动唯一写入循环，并在运行期间保持单飞。 */
  private startRunner(): void {
    if (this.runner || this.persistedRevision >= this.requestedRevision) return;
    this.runner = this.run().finally(() => {
      this.runner = null;
      this.schedule();
    });
  }

  /** 串行写入最新快照，并按版本完成等待方。 */
  private async run(): Promise<void> {
    while (this.persistedRevision < this.requestedRevision) {
      const targetRevision = this.requestedRevision;
      try {
        await this.options.write(this.options.snapshot());
      } catch (error) {
        // 当前内存状态仍然有效；拒绝本批等待方，下一次显式请求可重新保存最新状态。
        this.persistedRevision = this.requestedRevision;
        this.settleWaiters(this.persistedRevision, error);
        return;
      }
      this.persistedRevision = targetRevision;
      this.settleWaiters(targetRevision);
    }
  }

  /** 完成不晚于指定版本的等待方；传入错误时改为拒绝。 */
  private settleWaiters(revision: number, error?: unknown): void {
    let writeIndex = 0;
    for (const waiter of this.waiters) {
      if (waiter.revision <= revision) {
        if (error === undefined) waiter.resolve();
        else waiter.reject(error);
      } else {
        this.waiters[writeIndex++] = waiter;
      }
    }
    this.waiters.length = writeIndex;
  }
}
