// A pane's header: an observation feed label, the subject (program) and
// where it works, its test status, and the pane's controls: split, zoom and
// Administer Boot (the Boot Protocol, which asks before it ends anything).
// When the pane's Claude session was lost with its terminal (a reboot), it
// also offers RESUME EXPERIMENT, which resumes it into the idle shell.
// Click focuses the pane; right-click opens Herdr's pane menu.

import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, spaces, props, run, home, openOverlay, shared, setShared } from "herdr";
import { C, SIGN, caps, icon, programIcon, subjectName, menu, onRight, stopPress, sfx, STATUS_COLOR, STATUS_WORD } from "./kit.js";
import { resumeSession, LOST_KEY } from "./resume.js";
import { record, LOST_SEEN_KEY } from "./announcements.js";
import { announce, fill } from "./events.js";
import { LINES, RESUME_BUSY } from "./lexicon.js";

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
  // Resumes a lost session on request; resumeSession() refuses unless the shell is idle.
  resume(lost, cx) {
    if (this.resuming) return;
    this.resuming = true;
    cx.notify();
    cx.spawn(async (cx) => {
      const sent = await resumeSession(lost);
      this.resuming = false;
      const space = spaces().find((s) => s.tabs.some((t) => t.id === lost.tab));
      const ev = { kind: "resumed", name: "Claude Code", facility: space?.name, test: space?.tabs.find((t) => t.id === lost.tab)?.index };
      if (sent) {
        setShared(LOST_KEY, (shared(LOST_KEY) ?? []).filter((l) => l.terminal !== lost.terminal));
        setShared(LOST_SEEN_KEY, (shared(LOST_SEEN_KEY) ?? []).filter((s) => s !== lost.session));
        const a = announce(ev, Math.floor(Math.random() * LINES.resumed.length));
        record({ kind: a.kind, tag: a.tag, text: a.text, address: lost.terminal });
        sfx("tick");
      } else {
        record({ kind: "failed", tag: "RESUME REFUSED", text: fill(RESUME_BUSY, ev), address: lost.terminal });
      }
      cx.notify();
    });
  }

  render() {
    const p = panes().find((x) => x.pane === props()?.pane);
    if (!p) return div();
    const lost = (Array.isArray(shared(LOST_KEY)) ? shared(LOST_KEY) : []).find((l) => l.terminal === p.terminal && l.pane === p.pane);
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
      .when(Boolean(lost), (el) => el.child(
        h_flex().id(`resume-${pane}`).flex_none().px(8).h(20).gap(5).items_center().rounded(3).cursor_pointer()
          .bg(C.orange).text_color(C.ink).hover((s) => s.opacity(0.85))
          .tooltip(`Resume the Claude session lost with this terminal (claude --resume ${lost?.session.slice(0, 8)}…)`)
          .when(!this.resuming, (e) => e.loop("opacity", { from: 0.7, to: 1, period: 1400 }))
          .on_mouse_down("left", stopPress)
          .on_click((_e, cx) => { cx.stop_propagation(); this.resume(lost, cx); })
          .child(icon("resume", 10, C.ink))
          .child(div().font_family(SIGN).font_weight(700).text_size(11.5).child(this.resuming ? "RESUMING…" : "RESUME EXPERIMENT"))))
      .child(ctl(`sr-${pane}`, "split-right", "Split right (Ctrl+Shift+O)", () => run("pane.split", { direction: "right", pane })))
      .child(ctl(`sd-${pane}`, "split-down", "Split down (Ctrl+Shift+E)", () => run("pane.split", { direction: "down", pane })))
      // Zooming a tab's only pane changes nothing, so offer it once the tab is split (or to restore).
      .when(p.zoomed || panes().filter((x) => x.tab === p.tab).length > 1, (el) => el.child(
        ctl(`z-${pane}`, p.zoomed ? "unzoom" : "zoom", p.zoomed ? "Restore (Ctrl+Shift+Z)" : "Zoom (Ctrl+Shift+Z)", () => run("pane.zoom", { pane }))))
      .child(boot);
  }
}
