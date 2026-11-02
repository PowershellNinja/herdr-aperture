// The facility header: the Enrichment Center mark, the shown Testing Facility
// as chamber signage, the active test, subject counts, the clock and (where
// the system draws none) the window buttons. Dragging it moves the window.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents, run, window as appWindow } from "herdr";
import { C, SIGN, caps, two, icon, art, label, clock, menu, onRight, stopPress } from "./kit.js";

export default class Header {
  init(_p, cx) {
    this.now = new Date();
    const tick = (cx) => { this.now = new Date(); cx.notify(); };
    cx.timer.after(60000 - (Date.now() % 60000) + 50, (cx) => { tick(cx); cx.timer.every(60000, tick); });
  }

  render() {
    const w = appWindow();
    const space = spaces().find((s) => s.active);
    const test = space?.tabs.find((t) => t.active);
    const all = agents();
    const count = (st) => all.filter((a) => a.status === st).length;

    const brand = h_flex().gap(10).items_center().flex_none()
      .child(art("mark", 34))
      .child(v_flex()
        .child(div().font_family(SIGN).font_weight(700).text_size(21).text_color(C.ink).child("APERTURE SCIENCE"))
        .child(label("Enrichment Center · Monitoring Terminal", C.faint, 10.5)));

    const facility = h_flex().id("facility").gap(10).items_center().min_w(0).cursor_pointer()
      .on_mouse_down("left", stopPress)
      .on_click(() => run("app.palette"))
      .on_mouse_down("right", onRight(() => space && menu("space", { id: space.id })))
      .child(div().w(40).h(40).flex_none().bg(C.ink).flex().items_center().justify_center()
        .font_family(SIGN).font_weight(700).text_size(26).text_color(C.panel).child(two(space?.index ?? 0)))
      .child(v_flex().min_w(0)
        .child(label("Testing Facility", C.faint, 10.5))
        .child(div().truncate().font_family(SIGN).font_weight(700).text_size(19).text_color(C.ink).child(caps(space?.name ?? "Offline"))))
      .when(Boolean(test), (el) => el.child(v_flex().min_w(0).pl(12).border_l(1).border_color(C.rule)
        .child(label("Current Test", C.faint, 10.5))
        .child(div().truncate().font_family(SIGN).font_weight(600).text_size(16).text_color(C.ink2)
          .child(`TEST ${two(test.index)}${test.named ? " · " + caps(test.name) : ""}`))));

    const stat = (n, word, color, pulse) => h_flex().gap(5).items_center()
      .child(div().w(8).h(8).rounded(4).bg(n ? color : C.rule)
        .when(pulse && n > 0, (el) => el.loop("opacity", { from: 0.35, to: 1, period: 900 })))
      .child(div().font_family(SIGN).font_weight(600).text_size(13).text_color(n ? C.ink : C.faint).child(`${two(n)} ${word}`));

    const stats = h_flex().gap(14).items_center().flex_none()
      .child(stat(count("working"), "TESTING", C.blue))
      .child(stat(count("blocked"), "AWAITING", C.orange, true))
      .child(stat(count("done"), "COMPLETE", C.green));

    const time = v_flex().items_end().flex_none()
      .child(label("Facility Time", C.faint, 10.5))
      .child(div().font_family(SIGN).font_weight(700).text_size(19).text_color(C.ink).child(clock(this.now)));

    const btn = (id, name, cmd, danger) => div().id(id).w(42).h_full().flex().items_center().justify_center()
      .text_color(C.ink2).hover((s) => (danger ? s.bg(C.red).text_color("#ffffff") : s.bg(C.panel2)))
      .on_mouse_down("left", stopPress).on_click(() => run(cmd))
      .child(icon(name, 14, C.ink2));
    const buttons = w?.buttons
      ? h_flex().h_full().flex_none()
        .child(btn("win-min", "win-min", "window.minimize"))
        .child(btn("win-max", w.maximized ? "win-restore" : "win-max", "window.maximize"))
        .child(btn("win-close", "win-close", "window.close", true))
      : null;

    return h_flex().id("header").size_full().bg(C.panel).border_b(1).border_color(C.rule).items_center()
      .on_mouse_down("right", onRight(() => menu("global", {})))
      .child(div().w(6).h_full().flex_none().bg(C.orange))
      .child(h_flex().flex_1().min_w(0).h_full().items_center().gap(22)
        .pl(w?.platform === "macos" ? 86 : 14).pr(16)
        .child(brand)
        .child(div().w(1).h(34).flex_none().bg(C.rule))
        .child(div().flex_1().min_w(0).child(facility))
        .child(stats)
        .child(div().w(1).h(34).flex_none().bg(C.rule))
        .child(time))
      .when(Boolean(buttons), (el) => el.child(buttons));
  }
}
