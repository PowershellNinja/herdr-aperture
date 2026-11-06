import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { RESUME_LABEL, validSession, candidates, resumeCommand, unseen, lostIn, claim, resumeEach, stillResuming, releaseHolds, RESUME_HOLD } from "../aperture/mods/aperture/recovery.js";
import { labelArg } from "../aperture/mods/aperture/hooks/claude-session.mjs";

const ID = "88dff183-b9b7-48f2-8268-30c94f046195";
const term = (address, session, extra = {}) => ({ address, state: "live", labels: session === undefined ? {} : { [RESUME_LABEL]: session }, ...extra });
const pane = (terminal, tab = "tb1") => ({ pane: `p-${terminal}`, terminal, tab });

test("only a Claude session id is accepted, never text a shell would run", () => {
  assert.equal(validSession(ID), true);
  assert.equal(validSession("18748a73-40e5-49c3-abed-42c78660fd41"), true);
  assert.equal(validSession("x; rm -rf ~"), false);
  assert.equal(validSession("abc$(whoami)"), false);
  assert.equal(validSession(`${ID}; rm -rf ~`), false);
  assert.equal(validSession(`x ${ID}`), false);
  assert.equal(validSession(""), false);
  assert.equal(validSession(undefined), false);
});

test("a terminal with a lost session in a Herdr pane is a resume candidate", () => {
  assert.deepEqual(candidates([term("t1", ID)], [], [pane("t1")]), [{ terminal: "t1", session: ID, pane: "p-t1", tab: "tb1" }]);
});

test("a running agent, a finished or paneless terminal, or a bad label is no candidate", () => {
  assert.deepEqual(candidates([term("t1", ID)], [{ address: "t1" }], [pane("t1")]), []);
  assert.deepEqual(candidates([term("t1", ID, { state: "finished" })], [], [pane("t1")]), []);
  assert.deepEqual(candidates([term("t1", ID)], [], []), []);
  assert.deepEqual(candidates([term("t1", "x; rm -rf ~")], [], [pane("t1")]), []);
  assert.deepEqual(candidates([term("t1")], [], [pane("t1")]), []);
});

test("a session already running again in another terminal is not offered twice", () => {
  const resumedElsewhere = term("t2", ID);
  assert.deepEqual(candidates([term("t1", ID), resumedElsewhere], [{ address: "t2" }], [pane("t1"), pane("t2")]), []);
});

test("terminals on other machines are left alone", () => {
  assert.deepEqual(candidates([term("vps/t3", ID)], [], [pane("vps/t3")]), []);
});

test("the resume command names only the session", () => {
  assert.equal(resumeCommand(ID), `claude --resume ${ID}`);
  assert.throws(() => resumeCommand("x; rm -rf ~"));
});

test("a lost session is announced once", () => {
  const lost = [{ terminal: "t1", session: ID }, { terminal: "t2", session: "18748a73-40e5-49c3-abed-42c78660fd41" }];
  assert.deepEqual(unseen(lost, [ID]).map((l) => l.terminal), ["t2"]);
  assert.deepEqual(unseen(lost, [ID, "18748a73-40e5-49c3-abed-42c78660fd41"]), []);
});

test("the Claude hook labels the terminal on start and clears it on end", () => {
  assert.equal(labelArg("start", { session_id: ID }), `${RESUME_LABEL}=${ID}`);
  assert.equal(labelArg("end", { session_id: ID }), `${RESUME_LABEL}=`);
  assert.equal(labelArg("start", { session_id: "x; rm -rf ~" }), null);
  assert.equal(labelArg("start", { session_id: `${ID}; rm -rf ~` }), null);
  assert.equal(labelArg("start", {}), null);
  assert.equal(labelArg("bogus", { session_id: ID }), null);
});

test("the hook does nothing and exits 0 outside a Herdr terminal", () => {
  const hook = fileURLToPath(new URL("../aperture/mods/aperture/hooks/claude-session.mjs", import.meta.url));
  const env = { ...process.env };
  delete env.HC_TERMINAL_ID;
  const out = execFileSync(process.execPath, [hook, "start"], { input: JSON.stringify({ session_id: ID }), env, encoding: "utf8" });
  assert.equal(out, "");
});

const OTHER = "18748a73-40e5-49c3-abed-42c78660fd41";
const lostOne = (terminal, session, tab = "tb1") => ({ terminal, session, pane: `p-${terminal}`, tab });

test("a facility's lost sessions are those in its tabs, each session once", () => {
  const lost = [lostOne("t1", ID, "tb1"), lostOne("t2", ID, "tb2"), lostOne("t3", OTHER, "tb2"), lostOne("t4", "e0a1b2c3-0000-4000-8000-000000000000", "tb9")];
  const space = { tabs: [{ id: "tb1" }, { id: "tb2" }] };
  assert.deepEqual(lostIn(lost, space).map((l) => l.terminal), ["t1", "t3"]);
  assert.deepEqual(lostIn(lost, { tabs: [] }), []);
  assert.deepEqual(lostIn(undefined, space), []);
  assert.deepEqual(lostIn("garbage", space), []);
});

test("claiming takes a session off offer everywhere, so it can't be typed twice", () => {
  const lost = [lostOne("t1", ID), lostOne("t2", ID), lostOne("t3", OTHER)];
  const first = claim(lost, [lostOne("t1", ID)]);
  assert.deepEqual(first.taken.map((l) => l.terminal), ["t1"]);
  assert.deepEqual(first.rest.map((l) => l.terminal), ["t3"]);
  assert.deepEqual(claim(first.rest, [lostOne("t1", ID)]).taken, []); // the second click of a double click
  assert.deepEqual(claim(lost, [lostOne("t3", ID)]).taken, []); // that terminal holds another session now
});

test("a refusal doesn't stop the rest, and sessions are resumed one at a time", async () => {
  const list = [lostOne("t1", ID), lostOne("t2", OTHER), lostOne("t3", ID)];
  let running = 0, most = 0;
  const { sent, refused } = await resumeEach(list, async (l) => {
    most = Math.max(most, ++running);
    await new Promise((r) => setImmediate(r));
    running--;
    return l.terminal !== "t2";
  });
  assert.deepEqual(sent.map((l) => l.terminal), ["t1", "t3"]);
  assert.deepEqual(refused.map((l) => l.terminal), ["t2"]);
  assert.equal(most, 1);
});

test("the scan doesn't offer a session again while it is being resumed", () => {
  const now = 1_000_000;
  assert.equal(stillResuming({ [ID]: now - 1000 }, ID, now), true);
  assert.equal(stillResuming({ [ID]: now - 1000 }, OTHER, now), false);
  assert.equal(stillResuming(undefined, ID, now), false);
  assert.equal(stillResuming({ [ID]: now - RESUME_HOLD }, ID, now), false); // a run that never finished can't block it forever
});

test("after a run, sent sessions stay held, refused ones are free and old holds go", () => {
  const now = 1_000_000;
  const before = { [ID]: now - 5, [OTHER]: now - 5, old: now - RESUME_HOLD, other: now - 5 };
  assert.deepEqual(releaseHolds(before, [lostOne("t1", ID)], [lostOne("t2", OTHER)], now), { other: now - 5, [ID]: now });
});
