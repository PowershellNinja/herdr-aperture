// Aperture Science Enrichment Center: the whole aperture layout is this one
// mod, in roles. The layout and overlays give each copy props { role }:
//   header         facility signage, the shown facility, clock, window buttons
//   sidebar        Testing Facilities, Test Subjects and the GLaDOS monitor
//   tests          the shown facility's tests (tabs), Initiate Testing
//   pane           a pane's observation-feed header, with Administer Boot
//   announcements  Facility Announcements; also runs the event engine
//   boot           the Boot Protocol dialog
//   cake           the Cake Protocol window
//   records        Observation Records (the announcement log)

import { View, div } from "gpui-kit";
import { props } from "herdr";
import Header from "./header.js";
import Sidebar from "./sidebar.js";
import Tests from "./tests.js";
import PaneHeader from "./pane.js";
import Announcements from "./announcements.js";
import Boot from "./boot.js";
import Cake from "./cake.js";
import Records from "./records.js";

const ROLES = { header: Header, sidebar: Sidebar, tests: Tests, pane: PaneHeader, announcements: Announcements, boot: Boot, cake: Cake, records: Records };

export default class Aperture extends View {
  init(p, cx) {
    const pr = props() ?? p ?? {};
    const R = ROLES[pr.role];
    this.role = R ? new R() : null;
    this.role?.init?.(pr, cx);
  }

  render(cx) {
    if (!this.role) return div().child(`aperture: no role "${props()?.role}"`);
    return this.role.render(cx);
  }
}
