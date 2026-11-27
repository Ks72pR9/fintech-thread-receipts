import test from "node:test";
import assert from "node:assert/strict";
import { riskAction, threadEvent } from "./thread_service.ts";

test("large payment is held while typing and read events are publishable", () => {
  const payment = threadEvent.parse({ channel: "c", account_id: "a", actor: "u", kind: "payment", amount_cents: 100000 });
  const read = threadEvent.parse({ channel: "c", account_id: "a", actor: "u", kind: "read" });
  assert.equal(riskAction(payment), "hold");
  assert.equal(riskAction(read), "publish");
});
