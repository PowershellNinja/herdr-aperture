// Resuming a lost Claude session: the layout's side of recovery.js. A lost
// session is resumed only on request (the pane header's RESUME EXPERIMENT),
// and only into a shell that is idle right now: one with no child process.
// Herdr can't tell (a `claude attach` viewer looks like a plain shell), so
// this asks the OS, then types `claude --resume <id>` with `hc send`.

import { hc, exec, window as appWindow } from "herdr";
import { resumeCommand, validSession } from "./recovery.js";

export const LOST_KEY = "aperture.lost"; // [{ terminal, session, pane, tab }], kept by the announcements copy

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
