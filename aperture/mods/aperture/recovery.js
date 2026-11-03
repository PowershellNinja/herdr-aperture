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

/** Lost sessions not announced yet. */
export const unseen = (lost, seen) => (lost ?? []).filter((l) => !(seen ?? []).includes(l.session));
