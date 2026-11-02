// What a test subject and a test are called. Pure: no herdr or gpui imports,
// so `node --test` runs it.
//
// Claude Code (and other agents) put their session's name in the terminal
// title, sometimes after a status glyph ("✳ Fix login"). That title is the
// session name unless it only repeats the program's name.

/** The agent's session name from its terminal title, or null when the title says nothing. */
export function sessionName(agent) {
  const title = String(agent?.title ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
  if (!title) return null;
  const program = String(agent?.program?.name ?? "").trim().toLowerCase();
  return title.toLowerCase() === program ? null : title;
}

/** A tab's name: the one someone gave it, else its (focused, else first) subject's session name. */
export function testName(tab, agents) {
  if (tab?.named) return tab.name;
  const mine = (agents ?? []).filter((a) => a.tab === tab?.id);
  const lead = mine.find((a) => a.focused && sessionName(a)) ?? mine.find((a) => sessionName(a));
  return lead ? sessionName(lead) : null;
}
