// Facility Settings: the layout's own settings, since Herdr's Settings window
// can't be extended. The header gear opens a small menu (role "gear") with
// Facility Settings (role "settings", a dialog) and Herdr's own Settings.
// Values live in shared state (prefs.js), so every copy and restart sees them.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, run, shared, setShared, updates, openOverlay, closeOverlay } from "herdr";
import { C, SIGN, icon, label, stopPress } from "./kit.js";
import { prefs, toggle, PREFS_KEY } from "./prefs.js";

export function openGearMenu() {
  openOverlay({ mod: "aperture", kind: "popup", frame: "none", width: 250, height: 92, props: { role: "gear" } });
}

export function openFacilitySettings() {
  openOverlay({ mod: "aperture", kind: "dialog", frame: "none", width: 460, height: 296, props: { role: "settings" } });
}

const ROWS = [
  { key: "sounds", title: "Facility sounds", detail: "Chime, arrivals, boot, failure buzz and button ticks. Herdr's own alert sounds stay in Herdr's Settings." },
  { key: "cake", title: "Cake Protocol", detail: "Show the cake window when a test completes while you weren't looking. GLaDOS still announces the completion." },
];

export class GearMenu {
  render() {
    const close = () => closeOverlay(props()?.overlay);
    const row = (id, ic, text, hint, act, dot) => h_flex().id(id).w_full().h(38).px(12).gap(10).items_center().cursor_pointer()
      .hover((x) => x.bg(C.panel2))
      .on_click(() => { close(); act(); })
      .child(icon(ic, 15, C.ink2))
      .child(div().flex_1().font_family(SIGN).font_weight(700).text_size(13).text_color(C.ink).child(text))
      .when(Boolean(dot), (el) => el.child(div().w(7).h(7).rounded(4).bg(C.orange)))
      .when(Boolean(hint), (el) => el.child(label(hint, C.faint, 10.5)));
    return v_flex().id("gear-menu").size_full().py(4).bg(C.panel).border(1).border_color(C.ink).rounded(6).overflow_hidden()
      .child(row("gear-facility", "facility", "Facility Settings", null, openFacilitySettings))
      .child(row("gear-herdr", "settings", "Herdr Settings", "Ctrl+,", () => run("app.settings"), updates()?.app?.ready));
  }
}

export class FacilitySettings {
  render() {
    const p = prefs(shared(PREFS_KEY));
    const close = () => closeOverlay(props()?.overlay);

    const toggleRow = (r) => {
      const on = p[r.key];
      return h_flex().id(`pref-${r.key}`).w_full().px(16).py(12).gap(14).items_center().cursor_pointer()
        .border_b(1).border_color(C.panel2).hover((x) => x.bg("#ffffff"))
        .on_click(() => setShared(PREFS_KEY, toggle(shared(PREFS_KEY), r.key)))
        .child(v_flex().flex_1().min_w(0).gap(3)
          .child(div().font_family(SIGN).font_weight(700).text_size(14).text_color(C.ink).child(r.title.toUpperCase()))
          .child(div().text_size(12).line_height(1.35).text_color(C.ink2).child(r.detail)))
        .child(div().relative().w(38).h(20).flex_none().rounded(10).bg(on ? C.orange : C.rule)
          .child(div().absolute().top(2).left(on ? 20 : 2).w(16).h(16).rounded(8).bg("#ffffff")
            .transition("left", { duration: 140, easing: "ease-out" })));
    };

    return v_flex().id("facility-settings").size_full().bg(C.panel).border(1).border_color(C.ink).rounded(6).overflow_hidden()
      .child(h_flex().w_full().h(44).flex_none().px(16).gap(10).items_center().bg(C.ink)
        .child(icon("facility", 16, C.orange))
        .child(v_flex()
          .child(div().font_family(SIGN).font_weight(700).text_size(15).text_color(C.panel).child("FACILITY SETTINGS"))
          .child(label("This layout only · saved for every session", C.consoleDim, 10))))
      .children(ROWS.map(toggleRow))
      .child(div().flex_1())
      .child(h_flex().w_full().flex_none().px(16).pb(14).gap(8).items_center()
        .child(h_flex().id("to-herdr-settings").gap(6).items_center().cursor_pointer().text_color(C.ink2)
          .hover((x) => x.opacity(0.7)).on_mouse_down("left", stopPress)
          .on_click(() => { close(); run("app.settings"); })
          .child(icon("settings", 13, C.ink2))
          .child(label("Herdr Settings", C.ink2, 11.5)))
        .child(div().flex_1())
        .child(h_flex().id("settings-done").h(32).px(16).items_center().cursor_pointer().bg(C.orange)
          .hover((x) => x.opacity(0.85)).on_click(close)
          .child(div().font_family(SIGN).font_weight(700).text_size(13).text_color(C.ink).child("DONE"))));
  }
}
