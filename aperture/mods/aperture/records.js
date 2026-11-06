// Observation Records: every Facility Announcement this facility has kept,
// newest first, in a window that stays until closed.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, shared, setShared, closeOverlay, openOverlay } from "herdr";
import { C, SIGN, caps, two, icon, label, stopPress } from "./kit.js";

export const LOG_KEY = "aperture.log";
const TONE = { arrived: C.blue, blocked: C.orange, completed: C.green, failed: C.red, booted: C.orange, departed: C.faint, online: C.blue, terminated: C.red, cake: C.green, spared: C.blue, lost: C.orange, resumed: C.blue, resumedAll: C.blue };

export function openRecords() {
  openOverlay({ mod: "aperture", kind: "window", key: "aperture-records", frame: "none", width: 560, height: 460, props: { role: "records" } });
}

function time(ms) {
  const d = new Date(ms);
  return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}

export default class Records {
  render() {
    const log = Array.isArray(shared(LOG_KEY)) ? [...shared(LOG_KEY)].reverse() : [];
    const close = () => closeOverlay(props()?.overlay);
    const entry = (e, i) => h_flex().id(`rec-${i}`).w_full().gap(10).py(8).px(14).items_start().border_b(1).border_color(C.consoleRule)
      .child(div().w(4).h(30).flex_none().bg(TONE[e.kind] ?? C.consoleDim))
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(h_flex().gap(8)
          .child(label(time(e.at), C.consoleDim, 10.5))
          .child(label(e.tag ?? e.kind, TONE[e.kind] ?? C.consoleDim, 10.5)))
        .child(div().text_size(12.5).line_height(1.4).text_color(C.consoleInk).child(e.text)));

    return v_flex().id("records").size_full().bg(C.console).border(1).border_color(C.consoleRule).rounded(6).overflow_hidden()
      .child(h_flex().w_full().h(40).flex_none().px(14).gap(10).items_center().bg(C.panel).border_b(3).border_color(C.orange)
        .child(icon("records", 15, C.ink))
        .child(div().font_family(SIGN).font_weight(700).text_size(15).text_color(C.ink).child("OBSERVATION RECORDS"))
        .child(label(`${two(log.length)} entries`, C.faint, 11))
        .child(div().flex_1())
        .child(div().id("rec-clear").px(8).py(3).cursor_pointer().on_mouse_down("left", stopPress)
          .hover((x) => x.bg(C.panel2)).on_click(() => setShared(LOG_KEY, []))
          .child(label("Purge records", C.ink2, 11)))
        .child(div().id("rec-close").p(4).cursor_pointer().on_mouse_down("left", stopPress)
          .hover((x) => x.bg(C.panel2)).on_click(close)
          .child(icon("close", 14, C.ink))))
      .child(v_flex().id("rec-list").w_full().flex_1().overflow_y_scrollbar()
        .children(log.map(entry))
        .when(log.length === 0, (el) => el.child(div().p(16).text_size(12.5).text_color(C.consoleDim)
          .child(caps("No observations on file. Either nothing happened, or the records were purged. Both are suspicious.")))));
  }
}
