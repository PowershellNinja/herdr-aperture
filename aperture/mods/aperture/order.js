// Reordering tests by dragging. Pure: no herdr or gpui imports.

/**
 * What `tab.move` needs when the tab `fromId` is dropped on the tab `toId`:
 * the dragged tab takes the target's place. `index` is 1-based among all of
 * the space's tabs (settled ones keep their place too). Null when nothing moves.
 */
export function dropMove(tabs, fromId, toId) {
  if (!fromId || fromId === toId) return null;
  const from = (tabs ?? []).findIndex((t) => t.id === fromId);
  const to = (tabs ?? []).findIndex((t) => t.id === toId);
  if (from < 0 || to < 0) return null;
  return { id: fromId, index: to + 1 };
}
