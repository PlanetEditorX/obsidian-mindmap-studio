import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let writerModule;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/utils/coalesced-json-writer.ts");
  writerModule = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("CoalescedJsonWriter merges pending requests into one latest snapshot", async () => {
  let value = 0;
  const writes = [];
  const writer = new writerModule.CoalescedJsonWriter({
    delayMs: 60_000,
    snapshot: () => value,
    write: async (snapshot) => { writes.push(snapshot); }
  });

  value = 1;
  const first = writer.request();
  value = 2;
  const second = writer.request();
  value = 3;
  const third = writer.request();
  await writer.flush();
  await Promise.all([first, second, third]);

  assert.deepEqual(writes, [3]);
});

test("CoalescedJsonWriter serializes a request that arrives during an active write", async () => {
  let value = 1;
  let concurrentWrites = 0;
  let maximumConcurrentWrites = 0;
  const writes = [];
  let releaseFirstWrite;
  const firstWriteGate = new Promise((resolve) => { releaseFirstWrite = resolve; });
  const writer = new writerModule.CoalescedJsonWriter({
    delayMs: 60_000,
    snapshot: () => value,
    write: async (snapshot) => {
      concurrentWrites += 1;
      maximumConcurrentWrites = Math.max(maximumConcurrentWrites, concurrentWrites);
      writes.push(snapshot);
      if (writes.length === 1) await firstWriteGate;
      concurrentWrites -= 1;
    }
  });

  const first = writer.request();
  const flushing = writer.flush();
  await Promise.resolve();
  value = 2;
  const second = writer.request();
  releaseFirstWrite();
  await flushing;
  await Promise.all([first, second]);

  assert.deepEqual(writes, [1, 2]);
  assert.equal(maximumConcurrentWrites, 1);
});

test("CoalescedJsonWriter rejects a failed batch and can save a later request", async () => {
  let value = 1;
  let fail = true;
  const writes = [];
  const writer = new writerModule.CoalescedJsonWriter({
    delayMs: 60_000,
    snapshot: () => value,
    write: async (snapshot) => {
      writes.push(snapshot);
      if (fail) throw new Error("disk unavailable");
    }
  });

  const failed = writer.request();
  await writer.flush();
  await assert.rejects(failed, /disk unavailable/);

  fail = false;
  value = 2;
  const recovered = writer.request();
  await writer.flush();
  await recovered;
  assert.deepEqual(writes, [1, 2]);
});
