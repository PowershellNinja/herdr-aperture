// Resuming a lost Claude session: the layout's side of recovery.js. A lost
// session is resumed only on request (the pane header's RESUME EXPERIMENT, or
// a facility's RESUME ALL EXPERIMENTS), and only into a shell that is idle
// right now: one with no child process.
// Herdr can't tell (a `claude attach` viewer looks like a plain shell), so
// this asks the OS, then types `claude --resume <id>` with `hc send`.

import { hc, exec, spaces, agents, panes, terminals, shared, setShared, window as appWindow } from "herdr";
import { sfx } from "./kit.js";
import { record, LOST_SEEN_KEY } from "./announcements.js";
import { announce, fill } from "./events.js";
import { LINES, RESUME_BUSY } from "./lexicon.js";
import { candidates, claim, releaseHolds, resumeCommand, resumeEach, validSession } from "./recovery.js";

export const LOST_KEY = "aperture.lost"; // [{ terminal, session, pane, tab }], kept by the announcements copy
export const RESUMING_KEY = "aperture.resuming"; // { session: ms } while a run is at work on it

/** True when the terminal's shell runs nothing: no child process. False when unsure. */
export async function shellIdle(terminal) {
  try {
    const pid = JSON.parse((await hc(["get", terminal, "--json"])).stdout)?.pid;
    if (!Number.isInteger(pid) || pid <= 0) return false;
    if (appWindow()?.platform === "windows") {
      const r = await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
        `@(Get-CimInstance Win32_Process -Filter 'ParentProcessId=${pid}').Count`]);
      return r.code === 0 && r.stdout.trim() === "0";
    }
    const r = await exec("pgrep", ["-P", String(pid)]);
    return r.code === 1; // pgrep: 1 = no match
  } catch {
    return false;
  }
}

/**
 * Types the resume command into the terminal if its shell is idle. Ctrl+C first
 * clears anything half-typed at the prompt (`hc send` types at the cursor).
 * Resolves true when sent; false on any failure, never throws.
 */
export async function resumeSession(lost) {
  try {
    if (!validSession(lost?.session) || !(await shellIdle(lost.terminal))) return false;
    if ((await hc(["keys", lost.terminal, "ctrl+c"])).code !== 0) return false; // the line may not be clear
    const r = await hc(["send", lost.terminal, resumeCommand(lost.session)]);
    return r.code === 0;
  } catch {
    return false;
  }
}

const list = (key) => (Array.isArray(shared(key)) ? shared(key) : []);
const pick = (lines) => Math.floor(Math.random() * lines.length);

/**
 * Resumes these lost sessions and logs what happened. They leave the offer
 * before the first await, so a second click finds nothing to do; one that
 * could not be resumed comes back with the next scan if it is still lost.
 */
export async function resumeExperiments(wanted) {
  const { taken, rest } = claim(list(LOST_KEY), wanted);
  if (!taken.length) return;
  setShared(LOST_KEY, rest);
  const started = Date.now();
  setShared(RESUMING_KEY, { ...shared(RESUMING_KEY), ...Object.fromEntries(taken.map((l) => [l.session, started])) });
  // The offer can be 30s old, and a run takes time: ask again right before typing.
  const stillLost = (l) => candidates(terminals(), agents(), panes()).some((c) => c.terminal === l.terminal && c.session === l.session);
  const { sent, refused } = await resumeEach(taken, async (l) => stillLost(l) && resumeSession(l));
  setShared(RESUMING_KEY, releaseHolds(shared(RESUMING_KEY), sent, refused, Date.now()));

  const where = (l) => {
    const space = spaces().find((s) => s.tabs.some((t) => t.id === l.tab));
    return { facility: space?.name, test: space?.tabs.find((t) => t.id === l.tab)?.index };
  };
  if (sent.length) {
    const done = new Set(sent.map((l) => l.session));
    setShared(LOST_SEEN_KEY, list(LOST_SEEN_KEY).filter((s) => !done.has(s))); // a later outage is news again
    const kind = sent.length === 1 ? "resumed" : "resumedAll";
    const a = announce({ kind, count: sent.length, ...where(sent[0]) }, pick(LINES[kind]));
    record({ kind, tag: a.tag, text: a.text, address: sent[0].terminal });
    sfx("tick");
  }
  for (const l of refused) record({ kind: "failed", tag: "RESUME REFUSED", text: fill(RESUME_BUSY, where(l)), address: l.terminal });
}
