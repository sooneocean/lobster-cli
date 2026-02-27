import { describe, expect, it } from "vitest";
import { writeThread, readThread } from "../src/lib/store.js";

describe("store", () => {
  it("writes and reads thread", () => {
    const t = {
      thread_id: "t1",
      updated_at: new Date().toISOString(),
      current_step: "entry",
      state: { a: 1 },
      checkpoints: [{ step: "entry", ts: new Date().toISOString(), state: { a: 1 } }]
    };
    writeThread(t);
    const back = readThread("t1");
    expect(back?.thread_id).toBe("t1");
    expect(back?.state).toEqual({ a: 1 });
  });
});
