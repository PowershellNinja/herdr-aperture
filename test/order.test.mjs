import { test } from "node:test";
import assert from "node:assert/strict";
import { dropMove } from "../aperture/mods/aperture/order.js";

// A space's tabs in order, settled ones included (they keep their place).
const tabs = [{ id: "a" }, { id: "b", settled: true }, { id: "c" }, { id: "d" }];

test("dropping a tab on another moves it to that tab's place (1-based, among all tabs)", () => {
  assert.deepEqual(dropMove(tabs, "a", "d"), { id: "a", index: 4 });
  assert.deepEqual(dropMove(tabs, "d", "a"), { id: "d", index: 1 });
  assert.deepEqual(dropMove(tabs, "d", "c"), { id: "d", index: 3 });
});

test("dropping a tab on itself, or on a tab that is gone, moves nothing", () => {
  assert.equal(dropMove(tabs, "c", "c"), null);
  assert.equal(dropMove(tabs, "c", "zz"), null);
  assert.equal(dropMove(tabs, "zz", "c"), null);
  assert.equal(dropMove(tabs, null, "c"), null);
});
