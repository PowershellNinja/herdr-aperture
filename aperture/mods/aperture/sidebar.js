// The sidebar: Testing Facilities (spaces) as chamber signs, Test Subjects
// (agents) with their test status, and the GLaDOS monitor with the latest
// Facility Announcement and a way into the Observation Records.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents, run, setAgentOrder, shared } from "herdr";
import {
  C, SIGN, caps, two, icon, art, label, programIcon, menu, onRight, STATUS_COLOR, STATUS_WORD,
} from "./kit.js";
import { openRecords, LOG_KEY } from "./records.js";

const IDLE_LINE = "All test subjects are accounted for. That is not the same as all test subjects being useful.";

function section(id, title, n, action) {
  return h_flex().id(id).w_full().h(34).flex_none().px(14).items_center().justify_between()
    .border_b(1).border_color(C.rule)
    .child(h_flex().gap(8).items_center()
      .child(div().font_family(SIGN).font_weight(700).text_size(13).text_color(C.ink).child(caps(title)))
      .child(div().px(5).h(16).flex().items_center().bg(C.ink).text_color(C.panel).font_family(SIGN).font_weight(700).text_size(11).child(two(n))))
    .when(Boolean(action), (el) => el.child(action));
}

export default class Sidebar {
  render() {
    const list = spaces();
    const crew = agents();
    setAgentOrder(crew.map((a) => a.address));

    const facility = (s) => {
      const st = s.status;
      const tests = s.tabs.length;
      return h_flex().id(`fac-${s.id}`).w_full().h(48).flex_none().pr(12).gap(10).items_center().cursor_pointer()
        .bg(s.active ? "#ffffff" : C.panel).hover((x) => x.bg(s.active ? "#ffffff" : C.panel2))
        .border_b(1).border_color(C.panel2)
        .on_click(() => run("space.select", { id: s.id }))
        .on_mouse_down("right", onRight(() => menu("space", { id: s.id })))
        .child(div().w(4).h_full().flex_none().bg(s.active ? C.orange : C.panel))
        .child(div().w(32).h(32).flex_none().flex().items_center().justify_center()
          .bg(s.active ? C.ink : C.panel2).border(1).border_color(s.active ? C.ink : C.rule)
          .font_family(SIGN).font_weight(700).text_size(17).text_color(s.active ? C.panel : C.ink2)
          .child(two(s.index)))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().font_weight(600).text_size(14).text_color(C.ink).child(s.name))
          .child(label(`${two(tests)} ${tests === 1 ? "test" : "tests"}${s.machine ? " · " + s.machine : ""}${st ? " · " + STATUS_WORD[st] : ""}`,
            st === "blocked" ? C.orange : C.faint, 10.5)))
        .when(Boolean(st && st !== "idle"), (el) => el.child(div().w(8).h(8).rounded(4).flex_none().bg(STATUS_COLOR[st])
          .when(st === "blocked", (d) => d.loop("opacity", { from: 0.3, to: 1, period: 800 }))));
    };

    const subject = (a) => {
      const color = STATUS_COLOR[a.status] ?? C.faint;
      return h_flex().id(`sub-${a.address}`).w_full().h(46).flex_none().pr(12).gap(10).items_center().cursor_pointer()
        .bg(a.focused ? "#ffffff" : C.panel).hover((x) => x.bg(a.focused ? "#ffffff" : C.panel2))
        .border_b(1).border_color(C.panel2)
        .on_click(() => run("agent.focus", { terminal: a.address }))
        .on_mouse_down("right", onRight(() => menu("pane", { pane: a.pane, terminal: a.address })))
        .child(div().w(4).h_full().flex_none().bg(color)
          .when(a.status === "blocked", (d) => d.loop("opacity", { from: 0.3, to: 1, period: 700 })))
        .child(div().w(28).h(28).flex_none().flex().items_center().justify_center().rounded(4)
          .bg(a.program?.tile ?? C.ink).child(programIcon(a.program, 16, "#ffffff")))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().font_weight(600).text_size(13.5).text_color(C.ink)
            .child(a.program?.name ?? a.app ?? "Subject"))
          .child(label(`Test ${two(a.tab_index)} · ${a.space_name}`, C.faint, 10.5)))
        .child(div().flex_none().font_family(SIGN).font_weight(700).text_size(10.5).text_color(color)
          .when(a.status === "blocked", (d) => d.loop("opacity", { from: 0.4, to: 1, period: 900 }))
          .child(caps(STATUS_WORD[a.status] ?? a.status)));
    };

    const add = div().id("fac-new").p(4).rounded(3).cursor_pointer().tooltip("Construct a Testing Facility (Ctrl+Shift+N)")
      .hover((x) => x.bg(C.orange)).on_click(() => run("space.new", {}))
      .child(icon("plus", 13, C.ink));

    const log = shared(LOG_KEY);
    const latest = Array.isArray(log) && log.length ? log[log.length - 1] : null;
    const urgent = crew.some((a) => a.status === "blocked");

    const monitor = v_flex().id("glados").w_full().flex_none().p(12).gap(10).bg(C.console).border_t(3).border_color(C.orange)
      .child(h_flex().gap(12).items_center()
        .child(div().flex_none().loop("opacity", { from: urgent ? 0.55 : 0.8, to: 1, period: urgent ? 900 : 3600 }).child(art("optic", 46)))
        .child(v_flex().min_w(0)
          .child(div().font_family(SIGN).font_weight(700).text_size(14).text_color(C.consoleInk).child("GLaDOS"))
          .child(label("Facility Overseer · Online", C.consoleDim, 10))))
      .child(div().text_size(12.5).line_height(1.4).text_color(C.consoleInk).child(latest?.text ?? IDLE_LINE))
      .child(h_flex().id("open-records").gap(6).items_center().cursor_pointer()
        .text_color(C.orange).hover((x) => x.opacity(0.8))
        .on_click(() => openRecords())
        .child(icon("records", 13, C.orange))
        .child(div().font_family(SIGN).font_weight(700).text_size(11.5).child("OBSERVATION RECORDS"))
        .child(div().flex_1())
        .child(div().font_family(SIGN).font_weight(600).text_size(11).text_color(C.consoleDim)
          .child(`${two(Array.isArray(log) ? log.length : 0)} ENTRIES`)));

    return v_flex().id("sidebar").size_full().bg(C.panel).border_r(1).border_color(C.rule)
      .on_mouse_down("right", onRight(() => menu("global", {})))
      .child(section("h-fac", "Testing Facilities", list.length, add))
      .child(v_flex().id("fac-list").w_full().flex_1().min_h(60).overflow_y_scrollbar().children(list.map(facility)))
      .child(section("h-sub", "Test Subjects", crew.length))
      .child(v_flex().id("sub-list").w_full().flex_1().min_h(60).overflow_y_scrollbar()
        .children(crew.map(subject))
        .when(crew.length === 0, (el) => el.child(div().p(14).text_size(12).text_color(C.faint)
          .child("No test subjects. Initiate Testing to acquire one."))))
      .child(monitor);
  }
}
