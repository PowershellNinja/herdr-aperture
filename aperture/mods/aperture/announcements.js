// Facility Announcements: the bottom strip shows GLaDOS's latest line, the
// cake ledger and a way into the Observation Records. This copy (the layout
// has exactly one) also runs the event engine: render() compares agents()
// with the last look and only queues what happened; a slow timer publishes
// the queue (log, sounds, the Cake Protocol), so render has no side effects.
// It also finds Claude sessions lost with their terminal (scanLost) for the
// pane headers' RESUME EXPERIMENT; it never resumes anything itself.
// It also takes the layout's key commands: aperture.records, aperture.boot,
// aperture.settings, aperture.cake (a drill).

import { div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { agents, panes, terminals, shared, setShared, hc, nextCommand, openOverlay } from "herdr";
import { C, SIGN, two, icon, label, sfx, subjectName, stopPress } from "./kit.js";
import { snapshot, detect, classifyDeparture, announce, wantsCake } from "./events.js";
import { openRecords, LOG_KEY } from "./records.js";
import { openBoot } from "./pane.js";
import { LINES } from "./lexicon.js";
import { prefs, PREFS_KEY } from "./prefs.js";
import { openFacilitySettings } from "./settings.js";
import { candidates, unseen } from "./recovery.js";
import { shellIdle, LOST_KEY } from "./resume.js";

export const LOST_SEEN_KEY = "aperture.lostSeen"; // sessions already announced as lost

const KEEP = 80; // log entries kept in shared state
export const BOOTING_KEY = "aperture.booting"; // { address: ms } set by the Boot Protocol
export const CAKES_KEY = "aperture.cakes"; // { promised, delivered }
const ONLINE_KEY = "aperture.online";
const SOUND = { arrived: "arrive", failed: "fail", terminated: "thunk" };

/** Adds one announcement to the Observation Records (the monitor and strip show the newest). */
export function record(entry) {
  const log = Array.isArray(shared(LOG_KEY)) ? shared(LOG_KEY) : [];
  setShared(LOG_KEY, [...log, { at: Date.now(), ...entry }].slice(-KEEP));
}

export function openCake(ev, line) {
  const cakes = shared(CAKES_KEY) ?? { promised: 0, delivered: 0 };
  setShared(CAKES_KEY, { ...cakes, promised: (cakes.promised ?? 0) + 1 });
  record({ kind: "cake", tag: "CAKE PROTOCOL", text: line, address: ev.address });
  openOverlay({ mod: "aperture", kind: "window", key: "aperture-cake", frame: "none", width: 400, height: 268,
    props: { role: "cake", name: ev.name, facility: ev.facility, test: ev.test, address: ev.address, line } });
}

export default class Announcements {
  init(_p, cx) {
    this.prev = null;
    this.queue = []; // events to publish
    this.leaving = []; // departures waiting for hc to say how they ended
    this.turn = {}; // per kind: which line comes next
    for (const k of Object.keys(LINES)) this.turn[k] = Math.floor(Math.random() * LINES[k].length);

    const last = Number(shared(ONLINE_KEY)) || 0;
    if (Date.now() - last > 30 * 60 * 1000) this.queue.push({ kind: "online" });

    cx.timer.every(700, (cx) => this.publish(cx));
    // Lost Claude sessions (see recovery.js): once Herdr has its terminals, then gently.
    cx.timer.after(2000, (cx) => this.scanLost(cx));
    cx.timer.every(30000, (cx) => this.scanLost(cx));
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        try { this.command(c); } catch (e) { console.log(`aperture: ${c} failed: ${e}`); }
        cx.notify();
      }
    });
  }

  // Keeps shared LOST_KEY to the lost sessions whose shell is idle now, and
  // announces sessions not announced before (one line per outage).
  scanLost(cx) {
    if (this.scanning) return;
    const found = candidates(terminals(), agents(), panes());
    const before = Array.isArray(shared(LOST_KEY)) ? shared(LOST_KEY) : [];
    if (!found.length) {
      if (before.length) setShared(LOST_KEY, []);
      return;
    }
    this.scanning = true;
    cx.spawn(async (cx) => {
      const lost = [];
      for (const c of found) if (await shellIdle(c.terminal)) lost.push(c);
      this.scanning = false;
      if (JSON.stringify(lost) !== JSON.stringify(before)) setShared(LOST_KEY, lost);
      const seen = Array.isArray(shared(LOST_SEEN_KEY)) ? shared(LOST_SEEN_KEY) : [];
      const fresh = unseen(lost, seen);
      if (fresh.length) {
        setShared(LOST_SEEN_KEY, [...seen, ...fresh.map((l) => l.session)].slice(-50));
        const a = this.line({ kind: "lost", count: fresh.length });
        record({ kind: a.kind, tag: a.tag, text: a.text });
      }
      cx.notify();
    });
  }

  line(ev) {
    const n = this.turn[ev.kind] ?? 0;
    this.turn[ev.kind] = n + 1;
    return announce(ev, n);
  }

  publish(cx) {
    if (this.queue.length) {
      const evs = this.queue.splice(0);
      for (const ev of evs) {
        if (ev.kind === "departed") { this.leaving.push({ ...ev, since: Date.now() }); continue; }
        const a = this.line(ev);
        record({ kind: a.kind, tag: a.tag, text: a.text, address: ev.address });
        if (ev.kind === "online") { setShared(ONLINE_KEY, Date.now()); sfx("online"); }
        else if (SOUND[ev.kind]) sfx(SOUND[ev.kind]);
        if (wantsCake(ev) && prefs(shared(PREFS_KEY)).cake) openCake(ev, this.line({ ...ev, kind: "cake" }).text);
      }
    }
    // Give a departed subject's terminal a moment to finish, then ask the core how it ended.
    const ripe = this.leaving.filter((ev) => Date.now() - ev.since > 1200);
    if (!ripe.length || this.asking) return;
    this.leaving = this.leaving.filter((ev) => !ripe.includes(ev));
    this.asking = true;
    cx.spawn(async (cx) => {
      let all = [];
      try { all = JSON.parse((await hc(["ls", "--json", "--all"])).stdout).terminals ?? []; } catch {}
      const booting = shared(BOOTING_KEY) ?? {};
      for (const ev of ripe) {
        const term = all.find((t) => t.address === ev.address);
        const booted = Date.now() - (booting[ev.address] ?? 0) < 30000;
        const kind = classifyDeparture(ev, term, booted);
        const a = this.line({ ...ev, kind });
        record({ kind: a.kind, tag: a.tag, text: a.text, address: ev.address });
        if (SOUND[kind]) sfx(SOUND[kind]);
      }
      this.asking = false;
      cx.notify();
    });
  }

  command(c) {
    if (c === "records") return openRecords();
    if (c === "settings") return openFacilitySettings();
    if (c === "boot") {
      const p = panes().find((x) => x.focused);
      if (p) openBoot(p.pane, p.terminal, subjectName(p));
      return;
    }
    if (c === "cake") {
      const a = agents().find((x) => x.focused) ?? agents()[0];
      const ev = { kind: "completed", unseen: true, address: a?.address, name: a?.program?.name ?? "Test subject", facility: a?.space_name ?? "", test: a?.tab_index ?? 1 };
      openCake(ev, this.line({ ...ev, kind: "cake" }).text);
    }
  }

  render() {
    const snap = snapshot(agents());
    this.queue.push(...detect(this.prev, snap));
    this.prev = snap;

    const log = Array.isArray(shared(LOG_KEY)) ? shared(LOG_KEY) : [];
    const latest = log[log.length - 1];
    const fresh = latest && Date.now() - latest.at < 20000;
    const cakes = shared(CAKES_KEY) ?? { promised: 0, delivered: 0 };

    return h_flex().id("announcements").size_full().bg(C.panel).border_t(1).border_color(C.rule).items_center()
      .child(h_flex().h_full().flex_none().px(12).gap(7).items_center().bg(C.ink)
        .child(div().when(Boolean(fresh), (el) => el.loop("opacity", { from: 0.3, to: 1, period: 700 })).child(icon("speaker", 14, C.orange)))
        .child(div().font_family(SIGN).font_weight(700).text_size(12).text_color(C.panel).child("FACILITY ANNOUNCEMENTS")))
      .child(h_flex().id("latest").flex_1().min_w(0).h_full().px(12).gap(10).items_center().cursor_pointer()
        .hover((x) => x.bg(C.panel2)).on_click(() => openRecords())
        .when(Boolean(latest), (el) => el
          .child(label(latest.tag, C.orange, 11))
          .child(div().flex_1().min_w(0).truncate().text_size(13).text_color(C.ink).child(latest.text)))
        .when(!latest, (el) => el.child(div().text_size(13).text_color(C.faint).child("No announcements. Enjoy the silence while it is still available."))))
      .child(h_flex().h_full().flex_none().px(14).gap(14).items_center().border_l(1).border_color(C.rule)
        .child(label(`Cakes promised ${two(cakes.promised ?? 0)} · delivered ${two(cakes.delivered ?? 0)}`, C.ink2, 11.5)))
      .child(h_flex().id("records-btn").h_full().flex_none().px(12).gap(6).items_center().cursor_pointer()
        .border_l(1).border_color(C.rule).hover((x) => x.bg(C.panel2))
        .on_mouse_down("left", stopPress).on_click(() => openRecords())
        .child(icon("records", 13, C.ink2))
        .child(label(`Observation Records ${two(log.length)}`, C.ink2, 11.5)));
  }
}
