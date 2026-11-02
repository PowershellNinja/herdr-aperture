// The Boot Protocol: Administer Boot for one pane, opened from its header
// (or the aperture.boot key) with props { pane, terminal, name }. It asks
// first; confirming plays the kick, marks the terminal as booted (so the
// departure is announced as a boot, not a failure) and closes that pane,
// which ends its terminal. Esc or Spare Subject cancels. It never acts on
// any pane but the one it was opened for, and does nothing if that pane is gone.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, panes, run, shared, setShared, closeOverlay } from "herdr";
import { C, SIGN, caps, art, label, sfx, programIcon } from "./kit.js";
import { BOOT_WARNING, BOOT_PANEL, LINES } from "./lexicon.js";
import { fill, announce } from "./events.js";
import { record, BOOTING_KEY } from "./announcements.js";

const KICK_MS = 650; // the animation, before the pane closes

export default class Boot {
  init(_p, cx) {
    this.phase = "ask"; // ask | kick
    this.handle = cx.focus_handle();
    this.handle.focus();
  }

  target() {
    const p = props() ?? {};
    const pane = panes().find((x) => x.pane === p.pane);
    // The pane must still be there and still show the terminal we were opened for.
    if (!pane || (p.terminal && pane.terminal !== p.terminal)) return null;
    return pane;
  }

  close() {
    closeOverlay(props()?.overlay);
  }

  spare() {
    const p = props() ?? {};
    sfx("tick");
    if (p.terminal) {
      const a = announce({ kind: "spared", name: p.name }, Math.floor(Math.random() * LINES.spared.length));
      record({ kind: a.kind, tag: a.tag, text: a.text, address: p.terminal });
    }
    this.close();
  }

  kick(cx) {
    if (this.phase !== "ask") return;
    const pane = this.target();
    if (!pane) return this.close();
    this.phase = "kick";
    sfx("boot");
    cx.notify();
    cx.timer.after(KICK_MS, () => {
      const still = this.target();
      if (still) {
        if (still.terminal) setShared(BOOTING_KEY, { ...(shared(BOOTING_KEY) ?? {}), [still.terminal]: Date.now() });
        run("pane.close", { pane: still.pane });
      }
      this.close();
    });
  }

  render(cx) {
    const p = props() ?? {};
    const pane = this.target();
    const kicking = this.phase === "kick";
    const isTerminal = Boolean(p.terminal);
    const text = isTerminal ? fill(BOOT_WARNING, { name: p.name }) : BOOT_PANEL;

    const button = (id, text, primary, act) => h_flex().id(id).h(34).px(16).items_center().cursor_pointer()
      .bg(primary ? C.orange : C.panel2).border(1).border_color(primary ? C.orange : C.rule)
      .hover((s) => s.opacity(0.85))
      .on_click((_e, cx) => act(cx))
      .child(div().font_family(SIGN).font_weight(700).text_size(13).text_color(C.ink).child(text));

    // The kick: the boot swings in from the left, the subject's plate leaves to the right.
    const stage = div().relative().w_full().h(104).flex_none().overflow_hidden().bg(C.console)
      .child(div().absolute().top(26).left(kicking ? 470 : 216).w(170).h(52).px(10)
        .transition("left", { duration: 420, delay: 180, easing: "ease-in" })
        .opacity(kicking ? 0.2 : 1).transition("opacity", { duration: 420, delay: 180 })
        .flex().items_center().gap(8).bg(C.console2).border(1).border_color(C.consoleRule)
        .child(programIcon(pane?.program, 16, C.consoleInk))
        .child(v_flex().min_w(0)
          .child(label("Subject", C.consoleDim, 10))
          .child(div().truncate().font_weight(600).text_size(13).text_color(C.consoleInk).child(p.name ?? "Subject"))))
      .child(div().absolute().top(8).left(kicking ? 150 : 24)
        .transition("left", { duration: 220, easing: "ease-in" })
        .child(art("boot", 88)));

    return v_flex().id("boot").size_full().bg(C.panel).border(1).border_color(C.ink).rounded(6).overflow_hidden()
      .track_focus(this.handle)
      .on_key_down((e, cx) => {
        if (e.key === "escape") this.spare();
        else if (e.key === "enter") this.kick(cx);
        else return;
        cx.stop_propagation();
      })
      .child(h_flex().w_full().h(44).flex_none().px(14).gap(10).items_center().bg(C.ink)
        .child(art("hazard", 24))
        .child(v_flex()
          .child(div().font_family(SIGN).font_weight(700).text_size(15).text_color(C.panel).child(isTerminal ? "BOOT PROTOCOL" : "PANEL REMOVAL"))
          .child(label(isTerminal ? "Authorization required · Enter to administer · Esc to spare" : "Enter to close · Esc to keep", C.consoleDim, 10))))
      .child(stage)
      .child(div().flex_1().px(16).py(12).text_size(13).line_height(1.4).text_color(C.ink)
        .child(pane ? text : "The subject has already left. The boot remains, ready for the next one."))
      .child(h_flex().w_full().flex_none().px(16).pb(14).gap(8).justify_end()
        .child(button("spare", isTerminal ? "SPARE SUBJECT" : "KEEP PANEL", false, () => this.spare()))
        .when(Boolean(pane), (el) => el.child(button("administer", caps(isTerminal ? "Administer boot" : "Close panel"), true, (cx) => this.kick(cx)))));
  }
}
