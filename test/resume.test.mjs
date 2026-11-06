// The resume path end to end: the real resume.js and scan, on a pretend Herdr.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./stubs/hooks.mjs", import.meta.url);
const { S, reset } = await import("./stubs/herdr.mjs");
const { resumeExperiments, LOST_KEY, RESUMING_KEY } = await import("../aperture/mods/aperture/resume.js");
const { default: Announcements, LOST_SEEN_KEY } = await import("../aperture/mods/aperture/announcements.js");
const { RESUME_LABEL } = await import("../aperture/mods/aperture/recovery.js");
const { LOG_KEY } = await import("../aperture/mods/aperture/records.js");

const X = "88dff183-b9b7-48f2-8268-30c94f046195";
const Y = "18748a73-40e5-49c3-abed-42c78660fd41";
const Z = "e0a1b2c3-0000-4000-8000-000000000000";

const lost = (terminal, session) => ({ terminal, session, pane: `p-${terminal}`, tab: "tb1" });

/** Terminals carrying these sessions, all shown in a pane and all on offer. */
function outage(sessions) {
  S.terminals = Object.entries(sessions).map(([address, s]) => ({ address, state: "live", labels: { [RESUME_LABEL]: s } }));
  S.panes = Object.keys(sessions).map((t) => ({ pane: `p-${t}`, terminal: t, tab: "tb1" }));
  S.spaces = [{ id: "s1", name: "Drill", tabs: [{ id: "tb1", index: 1 }] }];
  S.shared[LOST_KEY] = Object.entries(sessions).map(([t, s]) => lost(t, s));
  S.shared[LOST_SEEN_KEY] = Object.values(sessions);
}

const offered = () => S.shared[LOST_KEY].map((l) => l.terminal);
const sends = () => S.typed.filter((c) => c.startsWith("send"));
const tags = () => (S.shared[LOG_KEY] ?? []).map((e) => e.tag);

const cx = { notify() {}, spawn: (f) => f(cx), timer: { after() {}, every() {} } };
async function scan() {
  const a = new Announcements();
  a.init({}, cx);
  a.scanLost(cx);
  while (a.scanning) await new Promise((r) => setImmediate(r));
  return a;
}

beforeEach(reset);

test("a double click types a session once", async () => {
  outage({ t1: X });
  await Promise.all([resumeExperiments([lost("t1", X)]), resumeExperiments([lost("t1", X)])]);
  assert.equal(sends().length, 1);
});

test("Ctrl+C clears the line first, then only the resume command is typed", async () => {
  outage({ t1: X });
  await resumeExperiments([lost("t1", X)]);
  assert.deepEqual(S.typed, ["keys t1 ctrl+c", `send t1 claude --resume ${X}`]);
});

test("a refused session is logged, the rest go on, and several get one summary line", async () => {
  outage({ t1: X, t2: Y, t3: Z });
  S.busy = ["t2"];
  await resumeExperiments([lost("t1", X), lost("t2", Y), lost("t3", Z)]);
  assert.deepEqual(sends().map((c) => c.split(" ")[1]), ["t1", "t3"]);
  assert.deepEqual(tags(), ["EXPERIMENTS RESUMED", "RESUME REFUSED"]);
});

test("a just-resumed session isn't offered from its other terminal before Claude reports in", async () => {
  outage({ t1: X, t2: X });
  await resumeExperiments([lost("t1", X)]);
  S.busy = ["t1"]; // Claude has started, but agents() doesn't show it yet
  await scan();
  assert.deepEqual(offered(), []);
  await resumeExperiments([lost("t2", X)]);
  assert.equal(sends().length, 1);
});

test("a run that finishes during a scan doesn't come back as a new outage", async () => {
  outage({ t1: X, t2: Y });
  S.duringIdleCheck = () => resumeExperiments([lost("t1", X)]);
  await scan();
  assert.deepEqual(offered(), ["t2"]);
  assert.deepEqual(tags(), ["EXPERIMENT RESUMED"]);
});

test("a refused session is offered again by the next scan", async () => {
  outage({ t1: X });
  S.busy = ["t1"];
  await resumeExperiments([lost("t1", X)]);
  assert.deepEqual(sends(), []);
  S.busy = [];
  await scan();
  assert.deepEqual(offered(), ["t1"]);
});

test("a session running elsewhere since the last scan isn't typed", async () => {
  outage({ t1: X, t9: X });
  S.agents = [{ address: "t9" }];
  S.shared[LOST_KEY] = [lost("t1", X)]; // the offer is up to 30s old
  await resumeExperiments([lost("t1", X)]);
  assert.deepEqual(S.typed, []);
  assert.deepEqual(tags(), ["RESUME REFUSED"]);
});

test("a terminal whose label changed since the last scan isn't typed", async () => {
  outage({ t1: Y });
  S.shared[LOST_KEY] = [lost("t1", X)];
  await resumeExperiments([lost("t1", X)]);
  assert.deepEqual(S.typed, []);
});

test("holds end with the run for refused sessions, not for sent ones", async () => {
  outage({ t1: X, t2: Y });
  S.busy = ["t2"];
  await resumeExperiments([lost("t1", X), lost("t2", Y)]);
  assert.deepEqual(Object.keys(S.shared[RESUMING_KEY]), [X]);
});

test("a scan during a run offers nothing the run has not reached yet", async () => {
  outage({ t1: X, t2: Y });
  let seen;
  S.duringIdleCheck = async () => { await scan(); seen = offered(); };
  await resumeExperiments([lost("t1", X), lost("t2", Y)]);
  assert.deepEqual(seen, []);
});

test("each session is checked again right before its own typing, not once per run", async () => {
  outage({ t1: X, t2: Y, t9: Y });
  S.shared[LOST_KEY] = [lost("t1", X), lost("t2", Y)];
  S.duringIdleCheck = () => { S.agents = [{ address: "t9" }]; }; // Y starts elsewhere while the run is at t1
  await resumeExperiments([lost("t1", X), lost("t2", Y)]);
  assert.deepEqual(sends().map((c) => c.split(" ")[1]), ["t1"]);
});
