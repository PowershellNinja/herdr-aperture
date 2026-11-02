// The tests bar: the shown facility's tests (tabs) as chamber tabs, coloured
// by their subjects' status, then Initiate Testing (Herdr's + menu: a shell
// or any installed agent). Suspended (settled) tests sit at the right with
// Resume Experiment. Right-click a test for Herdr's tab menu.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, run } from "herdr";
import { C, SIGN, caps, two, icon, menu, newMenu, onRight, STATUS_COLOR } from "./kit.js";

export default class Tests {
  render() {
    const space = spaces().find((s) => s.active);
    const tabs = space?.tabs ?? [];
    const open = tabs.filter((t) => !t.settled);
    const suspended = tabs.filter((t) => t.settled);

    const chip = (t) => {
      const color = STATUS_COLOR[t.status];
      return v_flex().id(`test-${t.id}`).h_full().flex_none().cursor_pointer()
        .bg(t.active ? "#ffffff" : C.panel2).border(1).border_color(t.active ? C.ink2 : C.rule)
        .hover((x) => x.bg("#ffffff"))
        .when(t.status === "blocked" && !t.active, (el) => el.loop("opacity", { from: 0.55, to: 1, period: 800 }))
        .on_click(() => run("tab.select", { id: t.id }))
        .on_mouse_down("right", onRight(() => menu("tab", { id: t.id, space: space.id })))
        .child(div().w_full().h(3).flex_none().bg(t.active ? C.orange : color ?? C.panel2))
        .child(h_flex().flex_1().px(12).gap(8).items_center()
          .child(div().font_family(SIGN).font_weight(700).text_size(13).text_color(t.active ? C.ink : C.ink2).child(`TEST ${two(t.index)}`))
          .when(t.named, (el) => el.child(div().max_w(180).truncate().text_size(13).text_color(t.active ? C.ink : C.ink2).child(t.name)))
          .when(Boolean(color), (el) => el.child(div().w(8).h(8).rounded(4).bg(color))));
    };

    const initiate = h_flex().id("initiate").h_full().flex_none().px(14).gap(7).items_center().cursor_pointer()
      .bg(C.orange).text_color(C.ink).hover((x) => x.opacity(0.85))
      .tooltip("Initiate Testing: a shell or a test subject (Ctrl+Shift+T for a shell)")
      .on_click(() => newMenu())
      .child(icon("plus", 13, C.ink))
      .child(div().font_family(SIGN).font_weight(700).text_size(13).child("INITIATE TESTING"));

    const resume = (t) => h_flex().id(`resume-${t.id}`).h_full().flex_none().px(10).gap(6).items_center().cursor_pointer()
      .border(1).border_color(C.rule).text_color(C.ink2).hover((x) => x.bg("#ffffff"))
      .tooltip(`Resume Experiment: bring test ${two(t.index)} back`)
      .on_click(() => { run("tab.unsettle", { id: t.id }); run("tab.select", { id: t.id }); })
      .on_mouse_down("right", onRight(() => menu("tab", { id: t.id, space: space.id })))
      .child(icon("resume", 11, C.ink2))
      .child(div().font_family(SIGN).font_weight(700).text_size(12).child(`RESUME EXPERIMENT · ${caps(t.named ? t.name : "Test " + two(t.index))}`));

    return h_flex().id("tests").size_full().gap(6).items_center()
      .on_mouse_down("right", onRight(() => menu("global", {})))
      .child(h_flex().id("tests-open").h_full().flex_1().min_w(0).gap(6).items_center().overflow_x_scrollbar()
        .children(open.map(chip))
        .child(initiate))
      .children(suspended.map(resume));
  }
}
