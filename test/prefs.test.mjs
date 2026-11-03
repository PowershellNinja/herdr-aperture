import { test } from "node:test";
import assert from "node:assert/strict";
import { prefs, toggle } from "../aperture/mods/aperture/prefs.js";

test("everything is on until someone turns it off", () => {
  assert.deepEqual(prefs(undefined), { sounds: true, cake: true });
  assert.deepEqual(prefs(null), { sounds: true, cake: true });
});

test("a setting turned off stays off, the others keep their default", () => {
  assert.deepEqual(prefs({ cake: false }), { sounds: true, cake: false });
  assert.deepEqual(prefs({ sounds: false }), { sounds: false, cake: true });
});

test("unknown keys and non-boolean values in shared state are ignored", () => {
  assert.deepEqual(prefs({ cake: "no", sounds: 0, turrets: false }), { sounds: true, cake: true });
  assert.deepEqual(prefs("garbage"), { sounds: true, cake: true });
});

test("toggling flips one setting and keeps the rest", () => {
  assert.deepEqual(toggle(undefined, "cake"), { sounds: true, cake: false });
  assert.deepEqual(toggle({ sounds: true, cake: false }, "cake"), { sounds: true, cake: true });
  assert.deepEqual(toggle({ cake: false }, "sounds"), { sounds: false, cake: false });
});
