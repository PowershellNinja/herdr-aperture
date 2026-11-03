#!/usr/bin/env node
// Claude Code hook for the Aperture layout: remembers which Claude session a
// Herdr terminal runs, so a session lost with its terminal (a reboot) can be
// resumed from the layout. Register it for SessionStart ("start") and
// SessionEnd ("end"); see the README. It labels the terminal through Herdr's
// own `hc label`, does nothing outside a Herdr terminal (no HC_TERMINAL_ID),
// and never fails a Claude session: every error is swallowed, exit code 0.

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const RESUME_LABEL = "aperture.claude";
// Claude session ids are UUIDs; nothing else is ever written (same rule as recovery.js).
const SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The `hc label` argument for a hook event, or null when there is nothing to do. */
export function labelArg(event, payload) {
  if (event === "end") return `${RESUME_LABEL}=`; // a session that ends normally is not lost
  if (event === "start" && SESSION.test(String(payload?.session_id ?? ""))) return `${RESUME_LABEL}=${payload.session_id}`;
  return null;
}

async function main() {
  const terminal = process.env.HC_TERMINAL_ID;
  if (!terminal) return;
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  let payload = {};
  try { payload = JSON.parse(input); } catch {}
  const arg = labelArg(process.argv[2], payload);
  if (arg) execFileSync("hc", ["label", terminal, arg], { stdio: "ignore", timeout: 1000 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {}).finally(() => process.exit(0));
}
