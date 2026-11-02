// A pane's header: an observation feed label, the subject (program) and
// where it works, its test status, and the pane's controls: split, zoom and
// Administer Boot (the Boot Protocol, which asks before it ends anything).
// Click focuses the pane; right-click opens Herdr's pane menu.

import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, home, openOverlay } from "herdr";
import { C, SIGN, caps, icon, programIcon, subjectName, menu, onRight, stopPress, STATUS_COLOR, STATUS_WORD } from "./kit.js";

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  if (cwd === h) return "~";
  return cwd.startsWith(h) ? "~" + cwd.slice(h.length) : cwd;
}

export function openBoot(pane, terminal, name) {
  openOverlay({ mod: "aperture", kind: "dialog", modal: true, frame: "none", width: 460, height: 300,
    props: { role: "boot", pane, terminal, name } });
}

export default class PaneHeader {
  render() {
    const p = panes().find((x) => x.pane === props()?.pane);
    if (!p) return div();
    const pane = p.pane;
    const st = p.status;
    const lit = p.focused;
    const name = subjectName(p);

    const ctl = (id, ic, tip, act) => div().id(id).px(5).h_full().flex().items_center()
      .text_color(C.consoleDim).hover((s) => s.bg(C.consoleRule)).tooltip(tip)
      .on_mouse_down("left", stopPress)
      .on_click((_e, cx) => { cx.stop_propagation(); act(); })
      .child(icon(ic, 13, C.consoleDim));

    const boot = div().id(`boot-${pane}`).px(8).h(20).flex().items_center().gap(5).rounded(3)
      .border(1).border_color(C.consoleRule).text_color(C.consoleDim)
      .hover((s) => s.bg(C.orange).border_color(C.orange).text_color(C.ink))
      .tooltip(p.terminal ? "Administer Boot: end this subject's test" : "Close this panel")
      .on_mouse_down("left", stopPress)
      .on_click((_e, cx) => { cx.stop_propagation(); openBoot(pane, p.terminal, name); })
      .child(div().font_family(SIGN).font_weight(700).text_size(11.5).child("BOOT"));

    return h_flex().id(`head-${pane}`).size_full().pl(10).pr(4).gap(8).items_center()
      .bg(lit ? C.console2 : C.console).border_b(1).border_color(lit ? C.orange : C.consoleRule)
      .on_click(() => run("pane.focus", { pane }))
      .on_mouse_down("right", onRight(() => menu("pane", { pane, terminal: p.terminal })))
      .child(div().w(7).h(7).rounded(4).flex_none().bg(lit ? C.red : C.consoleRule)
        .when(lit, (el) => el.loop("opacity", { from: 0.35, to: 1, period: 1600 })))
      .child(div().flex_none().font_family(SIGN).font_weight(600).text_size(11.5).text_color(C.consoleDim).child("OBSERVATION FEED"))
      .child(programIcon(p.program, 13, C.consoleInk))
      .child(div().flex_none().max_w(240).truncate().font_weight(600).text_size(12.5).text_color(C.consoleInk).child(name))
      .child(div().flex_1().min_w(0).truncate().text_size(11.5).text_color(C.consoleDim).child(folder(p.cwd)))
      .when(Boolean(st && st !== "idle"), (el) => el.child(
        div().flex_none().px(6).h(18).flex().items_center().rounded(3).bg(STATUS_COLOR[st] + "2a")
          .font_family(SIGN).font_weight(700).text_size(11).text_color(STATUS_COLOR[st])
          .when(st === "blocked", (e) => e.loop("opacity", { from: 0.45, to: 1, period: 900 }))
          .child(caps(STATUS_WORD[st]))))
      .child(ctl(`sr-${pane}`, "split-right", "Split right (Ctrl+Shift+O)", () => run("pane.split", { direction: "right", pane })))
      .child(ctl(`sd-${pane}`, "split-down", "Split down (Ctrl+Shift+E)", () => run("pane.split", { direction: "down", pane })))
      .child(ctl(`z-${pane}`, p.zoomed ? "unzoom" : "zoom", p.zoomed ? "Restore (Ctrl+Shift+Z)" : "Zoom (Ctrl+Shift+Z)", () => run("pane.zoom", { pane })))
      .child(boot);
  }
}
