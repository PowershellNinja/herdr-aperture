import { test } from "node:test";
import assert from "node:assert/strict";
import { snapshot, detect, classifyDeparture, announce, wantsCake } from "../aperture/mods/aperture/events.js";
import { LINES } from "../aperture/mods/aperture/lexicon.js";

const agent = (address, status, extra = {}) => ({
  address, status, program: { name: "Claude Code" }, space_name: "Private", tab_name: "fix login", tab_index: 2, ...extra,
});
const kinds = (evs) => evs.map((e) => `${e.kind}:${e.address}`);

test("the first look at the facility announces nothing", () => {
  assert.deepEqual(detect(null, snapshot([agent("t1", "working")])), []);
});

test("a new subject arrives; one already present does not arrive again", () => {
  const before = snapshot([agent("t1", "working")]);
  const after = snapshot([agent("t1", "working"), agent("t2", "idle")]);
  assert.deepEqual(kinds(detect(before, after)), ["arrived:t2"]);
  assert.deepEqual(detect(after, after), []);
});

test("a subject that starts waiting for input is announced once", () => {
  const working = snapshot([agent("t1", "working")]);
  const blocked = snapshot([agent("t1", "blocked")]);
  assert.deepEqual(kinds(detect(working, blocked)), ["blocked:t1"]);
  assert.deepEqual(detect(blocked, blocked), []);
});

test("finishing work completes the test; unseen only when Herdr says done", () => {
  const working = snapshot([agent("t1", "working")]);
  const [unseen] = detect(working, snapshot([agent("t1", "done")]));
  const [seen] = detect(working, snapshot([agent("t1", "idle")]));
  assert.equal(unseen.kind, "completed");
  assert.equal(unseen.unseen, true);
  assert.equal(seen.kind, "completed");
  assert.equal(seen.unseen, false);
});

test("being looked at after finishing is not a second completion", () => {
  assert.deepEqual(detect(snapshot([agent("t1", "done")]), snapshot([agent("t1", "idle")])), []);
  assert.deepEqual(detect(snapshot([agent("t1", "idle")]), snapshot([agent("t1", "working")])), []);
});

test("a subject that disappears departs, with what we knew about it", () => {
  const [ev] = detect(snapshot([agent("t1", "working")]), snapshot([]));
  assert.equal(ev.kind, "departed");
  assert.equal(ev.name, "Claude Code");
  assert.equal(ev.facility, "Private");
});

test("departures are classified by how the terminal ended", () => {
  const ev = { kind: "departed", address: "t1" };
  assert.equal(classifyDeparture(ev, { state: "finished", exit_code: 1, reason: "killed" }, true), "booted");
  assert.equal(classifyDeparture(ev, { state: "finished", exit_code: 1, reason: "killed" }, false), "terminated");
  assert.equal(classifyDeparture(ev, { state: "finished", exit_code: 2 }, false), "failed");
  assert.equal(classifyDeparture(ev, { state: "finished", exit_code: 0 }, false), "departed");
  assert.equal(classifyDeparture(ev, { state: "live" }, false), "departed");
  assert.equal(classifyDeparture(ev, undefined, false), "departed");
});

test("announcements name the subject, facility and test, and rotate lines", () => {
  const ev = { kind: "blocked", name: "Codex", facility: "ASKIA", test: 3 };
  const a = announce(ev, 0);
  const b = announce(ev, 1);
  assert.match(a.text, /Codex|ASKIA|03/);
  assert.doesNotMatch(a.text, /\{\w+\}/);
  assert.notEqual(a.text, b.text);
  assert.equal(a.kind, "blocked");
  assert.ok(a.tag.length > 0);
});

test("every event kind has enough original lines", () => {
  for (const k of ["online", "arrived", "blocked", "completed", "departed", "terminated", "failed", "booted", "cake", "spared"]) {
    assert.ok((LINES[k] ?? []).length >= 4, `${k} needs at least 4 lines`);
    for (const line of LINES[k]) assert.doesNotMatch(line, /\{(?!subject\}|facility\}|test\})\w+\}/, `${k}: unknown placeholder in "${line}"`);
  }
});

test("cake is served only for a test completed while nobody watched", () => {
  assert.equal(wantsCake({ kind: "completed", unseen: true }), true);
  assert.equal(wantsCake({ kind: "completed", unseen: false }), false);
  assert.equal(wantsCake({ kind: "blocked", unseen: true }), false);
});
