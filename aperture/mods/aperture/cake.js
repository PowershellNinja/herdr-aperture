// The Cake Protocol: a small window when a test finishes while nobody was
// watching. It looks for the cake for a few seconds, then reports a delivery
// status that is never "delivered". Accept Cake files a claim; Resume
// Experiment goes to the subject. It closes itself after a while and never
// takes the keyboard.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, run, closeOverlay } from "herdr";
import { C, SIGN, two, art, label, stopPress } from "./kit.js";
import { CAKE_STATUS, CAKE_ACCEPT } from "./lexicon.js";
import { record } from "./announcements.js";

const SEARCH_MS = 3200;
const STAY_MS = 16000;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default class Cake {
  init(_p, cx) {
    this.status = null; // null while "locating"
    cx.timer.after(SEARCH_MS, (cx) => { this.status = pick(CAKE_STATUS); cx.notify(); });
    cx.timer.after(STAY_MS, () => this.close());
  }

  close() {
    closeOverlay(props()?.overlay);
  }

  render() {
    const p = props() ?? {};
    const button = (id, text, primary, act) => h_flex().id(id).h(30).px(12).items_center().cursor_pointer()
      .bg(primary ? C.orange : C.panel2).border(1).border_color(primary ? C.orange : C.rule).hover((s) => s.opacity(0.85))
      .on_mouse_down("left", stopPress).on_click(() => act())
      .child(div().font_family(SIGN).font_weight(700).text_size(12).text_color(C.ink).child(text));

    return v_flex().id("cake").size_full().bg(C.panel).border(1).border_color(C.ink).rounded(6).overflow_hidden()
      .child(h_flex().w_full().h(36).flex_none().px(12).gap(8).items_center().bg(C.ink)
        .child(div().w(8).h(8).rounded(4).bg(C.green).loop("opacity", { from: 0.3, to: 1, period: 900 }))
        .child(div().font_family(SIGN).font_weight(700).text_size(14).text_color(C.panel).child("CAKE PROTOCOL"))
        .child(div().flex_1())
        .child(label(`Test ${two(p.test)} complete`, C.green, 11)))
      .child(h_flex().flex_1().px(14).py(12).gap(14).items_center()
        .child(div().relative().flex_none().loop("top", { from: 0, to: -5, period: 1800 }).child(art("cake", 88)))
        .child(v_flex().flex_1().min_w(0).gap(10)
          .child(div().text_size(13).line_height(1.4).text_color(C.ink).child(p.line ?? "Cake has been authorized."))
          .child(v_flex().gap(2)
            .child(label("Delivery status", C.faint, 10.5))
            .child(this.status
              ? div().font_family(SIGN).font_weight(700).text_size(14).text_color(C.orange).child(this.status)
              : div().font_family(SIGN).font_weight(700).text_size(14).text_color(C.ink2)
                .frames(["LOCATING CAKE", "LOCATING CAKE.", "LOCATING CAKE..", "LOCATING CAKE..."], 380)))))
      .child(h_flex().w_full().flex_none().px(14).pb(12).gap(8).justify_end()
        .when(Boolean(p.address), (el) => el.child(button("cake-resume", "RESUME EXPERIMENT", false, () => {
          run("agent.focus", { terminal: p.address });
          this.close();
        })))
        .child(button("cake-accept", "ACCEPT CAKE", true, () => {
          record({ kind: "cake", tag: "CAKE PROTOCOL", text: pick(CAKE_ACCEPT), address: p.address });
          this.close();
        })));
  }
}
