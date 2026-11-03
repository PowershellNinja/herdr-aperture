// The tests bar: the shown facility's tests (tabs) as chamber tabs, coloured
// by their subjects' status, then Initiate Testing (Herdr's + menu: a shell
// or any installed agent). Suspended (settled) tests sit at the right with
// Resume Experiment. Drag a test onto another to reorder. FILES and CHANGES open Herdr's own panels beside the
// terminals. Right-click a test for Herdr's tab menu.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, panes, run, layout, shared } from "herdr";
import { C, SIGN, caps, two, icon, menu, newMenu, onRight, sfx, STATUS_COLOR } from "./kit.js";
import { testName } from "./names.js";
import { dropMove } from "./order.js";
import { LOST_KEY } from "./resume.js";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class Tests {
  render() {
    const space = spaces().find((s) => s.active);
    const all = panes(); // tabs are named from their panes' titles (names.js)
    const tabs = space?.tabs ?? [];
    const open = tabs.filter((t) => !t.settled);
    const suspended = tabs.filter((t) => t.settled);
    // Tests whose Claude session was lost with its terminal: a marker; the action is in the pane header.
    const lostTabs = new Set((Array.isArray(shared(LOST_KEY)) ? shared(LOST_KEY) : []).map((l) => l.tab));

    // Drag a test onto another to take its place (tab.move), as Herdr's own tab bar does.
    const from = tabs.findIndex((x) => x.id === this.pressed);
    const chip = (t) => {
      const color = STATUS_COLOR[t.status];
      const name = testName(t, all);
      const dragged = this.pressed === t.id && this.over && this.over !== t.id;
      const target = this.pressed && this.pressed !== t.id && this.over === t.id;
      const leftward = from > tabs.findIndex((x) => x.id === t.id);
      return v_flex().id(`test-${t.id}`).relative().h_full().flex_none().cursor_pointer()
        .bg(t.active ? "#ffffff" : C.panel2).border(1).border_color(t.active ? C.ink2 : C.rule)
        .hover((x) => x.bg("#ffffff"))
        .when(t.status === "blocked" && !t.active, (el) => el.loop("opacity", { from: 0.55, to: 1, period: 800 }))
        .when(Boolean(dragged), (el) => el.opacity(0.45))
        .on_mouse_down("left", () => { this.pressed = t.id; this.over = t.id; })
        .on_mouse_move((_e, cx) => {
          if (this.pressed && this.over !== t.id) { this.over = t.id; cx.notify(); }
        })
        .on_mouse_up("left", (_e, cx) => {
          const move = dropMove(tabs, this.pressed, t.id);
          this.pressed = this.over = null;
          if (move) run("tab.move", move);
          cx.notify();
        })
        .on_click(() => run("tab.select", { id: t.id }))
        .on_mouse_down("right", onRight(() => menu("tab", { id: t.id, space: space.id })))
        .when(Boolean(target), (el) => el.child(div().absolute().top(0).bottom(0).w(3).bg(C.orange)
          .map((m) => (leftward ? m.left(-5) : m.right(-5)))))
        .child(div().w_full().h(3).flex_none().bg(t.active ? C.orange : color ?? C.panel2))
        .child(h_flex().flex_1().px(12).gap(8).items_center()
          .child(div().font_family(SIGN).font_weight(700).text_size(13).text_color(t.active ? C.ink : C.ink2).child(`TEST ${two(t.index)}`))
          .when(Boolean(name), (el) => el.child(div().max_w(220).truncate().text_size(13).text_color(t.active ? C.ink : C.ink2).child(name)))
          .when(Boolean(color), (el) => el.child(div().w(8).h(8).rounded(4).bg(color)))
          .when(lostTabs.has(t.id), (el) => el.child(div().id(`lost-${t.id}`)
            .tooltip("A Claude session was lost here: RESUME EXPERIMENT in its observation feed")
            .loop("opacity", { from: 0.5, to: 1, period: 1400 })
            .child(icon("resume", 10, C.orange)))));
    };

    const initiate = h_flex().id("initiate").h_full().flex_none().px(14).gap(7).items_center().cursor_pointer()
      .bg(C.orange).text_color(C.ink).hover((x) => x.opacity(0.85))
      .tooltip("Initiate Testing: a shell or a test subject (Ctrl+Shift+T for a shell)")
      .on_click(() => { sfx("tick"); newMenu(); })
      .child(icon("plus", 13, C.ink))
      .child(div().font_family(SIGN).font_weight(700).text_size(13).child("INITIATE TESTING"));

    const resume = (t) => h_flex().id(`resume-${t.id}`).h_full().flex_none().px(10).gap(6).items_center().cursor_pointer()
      .border(1).border_color(C.rule).text_color(C.ink2).hover((x) => x.bg("#ffffff"))
      .tooltip(`Resume Experiment: bring test ${two(t.index)} back`)
      .on_click(() => { sfx("tick"); run("tab.unsettle", { id: t.id }); run("tab.select", { id: t.id }); })
      .on_mouse_down("right", onRight(() => menu("tab", { id: t.id, space: space.id })))
      .child(icon("resume", 11, C.ink2))
      .child(div().font_family(SIGN).font_weight(700).text_size(12).child(`RESUME EXPERIMENT · ${caps(testName(t, all) ?? "Test " + two(t.index))}`));

    // Herdr's Files and Changes panels (the layout's "panel" stack), toggled as Herdr's own tab bar does.
    const panel = find(layout(), "panel");
    const body = find(layout(), "panel-body");
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    const panelButton = (id, text, ic) => {
      const on = Boolean(panel && !panel.hidden && body?.active === id);
      return h_flex().id(`panel-${id}`).h_full().flex_none().px(10).gap(6).items_center().cursor_pointer()
        .bg(on ? C.ink : C.panel2).border(1).border_color(on ? C.ink : C.rule)
        .hover((x) => x.bg(on ? C.ink2 : "#ffffff"))
        .tooltip(on ? `Close ${text.toLowerCase()}` : `Show ${text.toLowerCase()} for this facility`)
        .on_click(() => {
          if (on) run("layout.hide", { id: "panel" });
          else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
        })
        .child(icon(ic, 13, on ? C.panel : C.ink2))
        .child(div().font_family(SIGN).font_weight(700).text_size(12).text_color(on ? C.panel : C.ink2).child(text));
    };

    // A drag ends wherever the button comes up on the bar, and leaving the bar cancels it.
    const endDrag = (cx) => { if (this.pressed) { this.pressed = this.over = null; cx.notify(); } };
    return h_flex().id("tests").size_full().gap(6).items_center()
      .on_mouse_up("left", (_e, cx) => endDrag(cx))
      .on_hover((inside, cx) => { if (!inside) endDrag(cx); })
      .on_mouse_down("right", onRight(() => menu("global", {})))
      .child(h_flex().id("tests-open").h_full().flex_1().min_w(0).gap(6).items_center().overflow_x_scrollbar()
        .children(open.map(chip))
        .child(initiate))
      .children(suspended.map(resume))
      .when(Boolean(panel) && enabled.includes("files"), (el) => el.child(panelButton("files", "FILES", "files")))
      .when(Boolean(panel) && enabled.includes("changes"), (el) => el.child(panelButton("changes", "CHANGES", "changes")));
  }
}
