// Shared look and helpers for every Aperture role: the facility palette,
// signage type, icons, Herdr's own menus and the sound helper.

import { div, svg, image } from "gpui-kit";
import { openOverlay, playSound, settings } from "herdr";

export const ASSETS = "mods/aperture";

// Facility surfaces are light; monitoring panels (terminals, GLaDOS) are dark.
export const C = {
  wall: "#d9dad5",
  panel: "#f4f4f0",
  panel2: "#e7e8e3",
  rule: "#b7bab5",
  ink: "#1b2024",
  ink2: "#454c52",
  faint: "#7f878c",
  console: "#151b20",
  console2: "#1d252b",
  consoleRule: "#2e3940",
  consoleInk: "#d9dee1",
  consoleDim: "#7c878f",
  orange: "#ff8a00",
  blue: "#2fa8e0",
  green: "#8cc63f",
  red: "#e5533d",
  yellow: "#f6c343",
};

export const SIGN = "Barlow"; // signage face (Barlow Condensed does not register as its own family in Herdr 0.1.12)

export const STATUS_COLOR = { working: C.blue, blocked: C.orange, done: C.green, idle: C.faint, error: C.red };
export const STATUS_WORD = { working: "TESTING", blocked: "AWAITING INPUT", done: "TEST COMPLETE", idle: "STANDING BY", error: "MALFUNCTION" };

export const caps = (s) => String(s ?? "").toUpperCase();
export const two = (n) => String(n).padStart(2, "0");

export function icon(name, size, color) {
  return svg(`${ASSETS}/icons/${name}.svg`).size(size).flex_none().text_color(color);
}

export function art(name, w, h = w) {
  return image(`${ASSETS}/img/${name}.svg`).w(w).h(h).flex_none();
}

/** A program's icon from Herdr's program table, on a small tile. */
export function programIcon(program, size, fallback = C.ink2) {
  if (!program?.icon) return icon("subject", size, fallback);
  return program.tint ? svg(program.icon).size(size).flex_none().text_color(program.color ?? fallback) : image(program.icon).w(size).h(size).flex_none();
}

/** The name a subject goes by: its program for agents and shells, else its title. */
export function subjectName(p) {
  if (!p) return "Unknown subject";
  if (p.mod) return p.title || p.mod;
  return ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "Shell";
}

/** Small condensed caps label, the facility's signage voice. */
export function label(text, color = C.faint, size = 11) {
  return div().font_family(SIGN).font_weight(600).text_size(size).text_color(color).child(caps(text));
}

// Herdr's own menus keep every action (rename, close, worktrees, split) as in its layouts.
export const menu = (tab, target) => openOverlay({ mod: "menu", kind: "popup", width: 220, height: 260, props: { tab, target } });
export const newMenu = () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 });
export const onRight = (open) => (_e, cx) => { cx.stop_propagation(); open(); };
export const stopPress = (_e, cx) => cx.stop_propagation();

/** Plays one of the layout's sounds, unless the person turned Herdr's sounds off. */
export function sfx(name) {
  if (settings()?.sounds?.enabled === false) return;
  try { playSound(`${ASSETS}/sounds/${name}.mp3`); } catch (e) { console.log(`aperture: sound ${name}: ${e}`); }
}

export function clock(d) {
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}
