// The layout's own settings (Facility Settings), kept in Herdr's shared state
// under PREFS_KEY. Pure: no herdr or gpui imports. Everything is on by
// default; only explicit booleans for known settings count.

export const PREFS_KEY = "aperture.prefs";
const DEFAULTS = { sounds: true, cake: true };

export function prefs(stored) {
  const out = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) if (typeof stored?.[k] === "boolean") out[k] = stored[k];
  return out;
}

export function toggle(stored, key) {
  const p = prefs(stored);
  return { ...p, [key]: !p[key] };
}
