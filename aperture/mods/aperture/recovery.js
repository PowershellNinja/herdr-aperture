// Resuming Claude sessions lost with their terminal (a reboot, a core crash).
// The Claude Code hook (hooks/claude-session.mjs) labels each Herdr terminal
// with the session it runs and clears the label when the session ends
// normally. A label left on a live terminal that no longer runs an agent is a
// lost session. Pure: no herdr or gpui imports.

export const RESUME_LABEL = "aperture.claude";

// Claude session ids are UUIDs. Labels can be set by anything, and the id is
// typed into a shell, so nothing else is ever accepted. (The hook has its own copy.)
const SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const validSession = (id) => SESSION.test(String(id ?? ""));

/**
 * Terminals with a lost session that could be resumed: a valid session label,
 * live, shown in a Herdr pane, on this machine, not running an agent now,
 * and its session not already running again in another terminal.
 * Whether its shell is really idle is checked separately (a process query).
 */
export function candidates(terminals, agents, panes) {
  const running = new Set((agents ?? []).map((a) => a.address));
  const live = new Set((terminals ?? []).filter((t) => running.has(t.address)).map((t) => t.labels?.[RESUME_LABEL]));
  const out = [];
  for (const t of terminals ?? []) {
    const session = t?.labels?.[RESUME_LABEL];
    if (!validSession(session) || t.state !== "live" || running.has(t.address) || live.has(session) || String(t.address).includes("/")) continue;
    const p = (panes ?? []).find((x) => x.terminal === t.address);
    if (p) out.push({ terminal: t.address, session, pane: p.pane, tab: p.tab });
  }
  return out;
}

export function resumeCommand(session) {
  if (!validSession(session)) throw new Error("not a Claude session id");
  return `claude --resume ${session}`;
}

/** A facility's lost sessions. A session lost in two of its terminals counts once. */
export function lostIn(lost, space) {
  const tabs = new Set((space?.tabs ?? []).map((t) => t.id));
  const seen = new Set();
  return (Array.isArray(lost) ? lost : []).filter((l) => {
    if (!tabs.has(l.tab) || seen.has(l.session)) return false;
    seen.add(l.session);
    return true;
  });
}

/**
 * Takes what was asked for off offer, as far as it is still on offer. Every
 * terminal holding a taken session goes with it, so no later click (a double
 * click, the pane's own button) can type that session a second time.
 */
export function claim(lost, wanted) {
  const taken = (wanted ?? []).filter((w) => (lost ?? []).some((l) => l.terminal === w.terminal && l.session === w.session));
  const sessions = new Set(taken.map((t) => t.session));
  return { taken, rest: (lost ?? []).filter((l) => !sessions.has(l.session)) };
}

// A run over many terminals takes a while, and Claude takes a while to show up
// in agents() after that. Until then the scan would offer the session again, so
// it holds off. The time limit is for a run that never finished, or a Claude
// that didn't start: then the session really is still lost.
export const RESUME_HOLD = 120000;
export const stillResuming = (resuming, session, now) => now - (resuming?.[session] ?? 0) < RESUME_HOLD;

/** The holds after a run: sent sessions wait for Claude, refused ones are free, old ones are gone. */
export function releaseHolds(resuming, sent, refused, now) {
  const holds = Object.fromEntries(Object.entries(resuming ?? {}).filter(([session]) => stillResuming(resuming, session, now)));
  for (const l of sent) holds[l.session] = now;
  for (const l of refused) delete holds[l.session];
  return holds;
}

/** Resumes one after another. A refusal doesn't stop the rest. */
export async function resumeEach(list, resume) {
  const sent = [], refused = [];
  for (const l of list) ((await resume(l)) ? sent : refused).push(l);
  return { sent, refused };
}

/** Lost sessions not announced yet. */
export const unseen = (lost, seen) => (lost ?? []).filter((l) => !(seen ?? []).includes(l.session));
