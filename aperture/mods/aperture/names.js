// What a test subject and a test are called. Pure: no herdr or gpui imports,
// so `node --test` runs it.
//
// Claude Code (and other agents) put their session's name in the terminal
// title, sometimes after a status glyph ("✳ Fix login"). That title is the
// session name unless it only repeats the program's name. A Test Subject's
// name comes only from agents; a tab may also take its name from a shell
// whose title a program set (e.g. `claude attach` showing a background
// session, which Herdr sees as a plain shell), but never from a shell's own
// address or folder.

const clean = (title) => String(title ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
const same = (a, b) => a.toLowerCase() === String(b ?? "").trim().toLowerCase();

/** The agent's session name from its terminal title, or null when the title says nothing. */
export function sessionName(agent) {
  if (!agent?.program?.agent) return null; // a shell's title is its address or folder, not a session
  const title = clean(agent.title);
  return !title || same(title, agent.program.name) ? null : title;
}

/** A pane's title when it names something: an agent's session, or a title a program set in a shell. */
export function paneName(pane) {
  if (!pane?.terminal) return null; // a mod pane's title is the mod
  if (pane.program?.agent) return sessionName(pane);
  if (/[\\/]/.test(String(pane.title ?? ""))) return null; // a folder (checked before cleaning eats "~/"): the prompt, not a name
  const title = clean(pane.title);
  if (!title || same(title, pane.program?.name) || same(title, pane.terminal)) return null;
  return title;
}

/** A tab's name: the one someone gave it, else the focused pane's, an agent's, or any pane's title that names something. */
export function testName(tab, panes) {
  if (tab?.named) return tab.name;
  const mine = (panes ?? []).filter((p) => p.tab === tab?.id && paneName(p));
  const lead = mine.find((p) => p.focused) ?? mine.find((p) => p.program?.agent) ?? mine[0];
  return lead ? paneName(lead) : null;
}
