// The event engine's pure half: compare two looks at the facility's agents
// and say what happened, then turn an event into an announcement. No herdr or
// gpui imports, so `node --test` runs it.

import { LINES, TAGS } from "./lexicon.js";
import { sessionName } from "./names.js";

const two = (n) => String(n ?? 0).padStart(2, "0");

/** What we remember of each agent, by address. */
export function snapshot(agents) {
  const s = {};
  for (const a of agents ?? []) {
    s[a.address] = {
      status: a.status,
      name: sessionName(a) ?? a.program?.name ?? a.app ?? "Subject",
      facility: a.space_name ?? "",
      test: a.tab_index ?? 0,
    };
  }
  return s;
}

/**
 * Events between two snapshots. The first look (prev null) is a baseline,
 * not news. Kinds: arrived, blocked, completed (unseen: Herdr's "done", it
 * finished while nobody looked), departed (classified later). The core's
 * `error` status reaches mods as "blocked" (Herdr 0.1.12), so a failure is
 * only known from the exit code once the subject departs.
 */
export function detect(prev, next) {
  if (!prev) return [];
  const out = [];
  for (const [address, n] of Object.entries(next)) {
    const p = prev[address];
    const ev = { address, name: n.name, facility: n.facility, test: n.test, status: n.status };
    if (!p) out.push({ kind: "arrived", ...ev });
    else if (n.status === "blocked" && p.status !== "blocked") out.push({ kind: "blocked", ...ev });
    else if (p.status === "working" && (n.status === "done" || n.status === "idle")) out.push({ kind: "completed", unseen: n.status === "done", ...ev });
  }
  for (const [address, p] of Object.entries(prev)) {
    if (!next[address]) out.push({ kind: "departed", address, name: p.name, facility: p.facility, test: p.test });
  }
  return out;
}

/**
 * How a departed subject left, from its `hc ls --json --all` entry and
 * whether the Boot Protocol was administered to it.
 */
export function classifyDeparture(_ev, term, booted) {
  if (booted) return "booted";
  if (!term || term.state !== "finished") return "departed"; // the agent quit; its shell lives on
  if (term.reason === "killed") return "terminated";
  if (term.exit_code) return "failed";
  return "departed";
}

export function fill(template, ev) {
  return template
    .replaceAll("{subject}", ev.name ?? "The subject")
    .replaceAll("{facility}", ev.facility || "the facility")
    .replaceAll("{test}", two(ev.test))
    .replaceAll("{count}", two(ev.count));
}

/** The n-th line for this event's kind (callers rotate n so lines don't repeat back to back). */
export function announce(ev, n) {
  const lines = LINES[ev.kind] ?? LINES.online;
  return { kind: ev.kind, tag: TAGS[ev.kind] ?? ev.kind, text: fill(lines[n % lines.length], ev) };
}

/** The Cake Protocol is for tests that finished while nobody was watching. */
export function wantsCake(ev) {
  return ev.kind === "completed" && ev.unseen === true;
}
