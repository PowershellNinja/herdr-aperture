# Aperture Science for Herdr

An Enrichment Center monitoring terminal around your terminals, for the
[Herdr](https://herdr.dev) app. Clean facility panels and chamber signage
frame dark monitoring consoles, and a facility overseer comments on
everything your agents do, in a tone that is mostly professional.

*"Thank you for participating in this test. Your continued usefulness is being evaluated."*

![Aperture Science for Herdr](aperture/preview.png)

A real Herdr window: Claude Code running Test Chamber 07, with the
Observation Records open. Private paths are blurred.

> Unofficial fan work, not affiliated with or endorsed by Valve. All art,
> sounds and dialogue are original. The fonts are Barlow (SIL OFL 1.1).

## Features

- **Facility frame.** The header carries the Enrichment Center mark, the
  shown Testing Facility as a chamber sign, the current test, live counts
  (testing, awaiting, complete), the facility clock, the settings gear
  (Facility Settings and Herdr's Settings, with a dot when an update waits)
  and window buttons.
  Click the facility for the command palette; right-click it for Herdr's
  space menu.
- **Testing Facilities and Test Subjects.** Spaces are numbered chamber
  signs. Agents are listed by their session name (Claude Code's conversation
  title, else the program) with their test status, and a subject waiting
  for you pulses orange.
- **Tests bar.** Tabs are chamber tabs coloured by status, named after their
  session unless you named the tab yourself. A plain shell whose title a
  program set (e.g. `claude attach` showing a background session) names its
  tab too; a shell's own folder or address never does. Drag a test onto
  another to reorder. **Initiate
  Testing** opens Herdr's own + menu: a shell or any installed agent. Settled
  tabs wait at the right as **Resume Experiment**. **FILES** and **CHANGES**
  open Herdr's own Files and Changes panels beside the terminals.
- **Observation feeds.** Every pane gets a header with the subject, its
  folder, its status, split, zoom (once the test is split) and **BOOT**.
- **GLaDOS.** A monitor in the sidebar holds a breathing optic (faster when
  someone is waiting) and the latest Facility Announcement. Original lines
  react to real events: a subject arriving, waiting for input, completing,
  failing, leaving, or being ended without the proper paperwork.
  > *"Claude Code is blocked. Not by a wall. By you."*
  > *"Test 02 complete. Codex performed adequately. That is the highest grade I am authorized to give."*
  > *"Claude Code crashed. I'd say it isn't your fault, but I've read the output."*

  The last 80 lines are kept as **Observation Records**.
- **Cake Protocol.** When a test completes while you weren't looking, a cake
  window appears, searches for the cake, and reports a delivery status. The
  status is never "delivered". The bottom strip keeps the ledger: cakes
  promised, cakes delivered (00).
- **Boot Protocol.** BOOT asks first: Enter administers, Esc spares the
  subject. Then the boot swings, the subject's plate leaves, and that pane
  closes, ending its terminal. Nothing else is touched.
- **Sounds.** A facility chime, subject arrival, a relay thunk, a failure
  buzz, the boot's thud and a faint UI tick. All are synthesized, no louder
  than Herdr's own alerts, and silent when Herdr's sounds are off.

Every button runs a real Herdr command or opens Herdr's own menus. Your
keys, menus, splits and worktrees work as before.

## Terminology

| Herdr | Enrichment Center |
|---|---|
| Spaces | Testing Facilities |
| Tabs (sessions) | Tests |
| Agents | Test Subjects |
| New tab / + menu | Initiate Testing |
| Settled tab, brought back | Resume Experiment |
| Close pane / stop | Administer Boot |
| Log | Observation Records |
| Notifications | Facility Announcements |

## Install

### With your agent

In a Herdr terminal, ask your coding agent:

```text
Add the layout herdr.dev/layouts/PowershellNinja/herdr-aperture
```

The agent reads `aperture/RECIPE.md`, copies the layout and its mod into
`~/.config/herdr-app` and switches to it.

### Manually

You need the Herdr app and Node 18 or later.

```sh
git clone https://github.com/PowershellNinja/herdr-aperture
cd herdr-aperture
node tools/install.mjs
herdr-app check ~/.config/herdr-app/mods/aperture
herdr-app do layout.switch --name aperture
```

`tools/install.mjs` writes only `layouts/aperture.json` and `mods/aperture/`
in `${HERDR_APP_HOME:-~/.config/herdr-app}`. `Ctrl+Shift+L` cycles back to
your other layouts.

## Update

```sh
git pull
node tools/install.mjs
```

Herdr reloads the layout and the mod live.

## Uninstall

Switch to another layout, then delete `layouts/aperture.json` and
`mods/aperture/` from the Herdr home. GLaDOS's records live in Herdr's
`shared.json` under `aperture.*`. They are harmless, but she would prefer
you didn't look.

## Facility Settings

The header gear opens **Facility Settings**, the layout's own switches:

- **Facility sounds:** the chime, arrivals, boot, failure buzz and button
  ticks. Herdr's alert sounds are set in Herdr's Settings.
- **Cake Protocol:** the cake window for tests completed while you weren't
  looking. GLaDOS still announces the completion.

Both start on and are kept in Herdr's `shared.json` (`aperture.prefs`).
Herdr's own Settings window can't be extended by layouts, so these live in
their own dialog. The same gear also opens Herdr's Settings.

## Resume lost Claude sessions (opt-in)

When the machine reboots or herdr-core crashes, Herdr brings back every tab
with a fresh shell, but the Claude sessions that ran there are gone. With
the hook below, each Herdr terminal remembers the Claude session it runs.
After such an outage:

- the pane's observation feed shows **RESUME EXPERIMENT**, which types
  `claude --resume <session-id>` into that shell;
- its test chip carries a small resume marker;
- its facility in the sidebar shows **RESUME ALL EXPERIMENTS**, which does the
  same for every session lost in that facility, one after the other;
- GLaDOS announces how many subjects were lost.

Nothing is resumed on its own. The button only appears, and only types,
when the shell is idle (no running program). A session that ends normally
clears its mark, so only sessions lost with their terminal are offered.

**Setup:** add the hook to `~/.claude/settings.json` (merge it with any
`hooks` you already have; `$HOME` works in both Git Bash and PowerShell,
which run Claude Code hooks on Windows; adjust the path if your Herdr home differs):

```json
"hooks": {
  "SessionStart": [{ "hooks": [{ "type": "command",
    "command": "node \"$HOME/.config/herdr-app/mods/aperture/hooks/claude-session.mjs\" start" }] }],
  "SessionEnd": [{ "hooks": [{ "type": "command",
    "command": "node \"$HOME/.config/herdr-app/mods/aperture/hooks/claude-session.mjs\" end" }] }]
}
```

The hook only labels the terminal it runs in (`hc label <terminal>
aperture.claude=<session-id>`). Outside a Herdr terminal it does nothing,
and it never fails a Claude session. It only covers sessions started after
it was added.

Limits: commands that run inside the shell itself (a PowerShell cmdlet such
as `Copy-Item`, a script waiting at `Read-Host`) start no child process, so
the shell looks idle. Resume first presses Ctrl+C to clear the prompt line,
which would interrupt such a command: check the pane before clicking, and
every pane of the facility before Resume All. A
`claude -p` run inside a session overwrites the session's mark until it ends.

## Optional extras

**Keys.** The layout's mod takes four commands. Add any you want to `keys.json`:

```json
"layout:aperture": {
  "ctrl-shift-r": "aperture.records",
  "ctrl-shift-delete": "aperture.boot"
}
```

`aperture.settings` opens Facility Settings and `aperture.cake` runs a cake
drill. All four also work from a shell, e.g. `herdr-app do aperture.records`.

**Themed alert sounds.** Herdr's "agent needs you" and "agent finished"
sounds come from `settings.json` and apply to every layout. To use the
facility's, set them yourself:

```json
"sounds": { "enabled": true, "done": "mods/aperture/sounds/cake.mp3", "blocked": "mods/aperture/sounds/blocked.mp3" }
```

## Design

| Role | Colour |
|---|---|
| Facility panel | `#f4f4f0` |
| Panel rule | `#b7bab5` |
| Signage ink | `#1b2024` |
| Monitoring console / terminal | `#151b20` / `#12171b` |
| Focus, attention, Boot | `#ff8a00` |
| Testing | `#2fa8e0` |
| Test complete | `#8cc63f` |
| Failure | `#e5533d` |

Signage and UI text use Barlow (bundled); terminals use JetBrains Mono. The
theme overrides every colour, ANSI 0–15 included, so Herdr's own menus and
dialogs come out as dark consoles too.

## Limitations

What Herdr 0.1.12's customization system doesn't expose, documented rather
than worked around:

- **Herdr's own screens keep Herdr's words.** The palette, settings,
  right-click and + menus, prompts and "An agent needs you" toasts are
  shared by all layouts.
- **Notifications and alert sounds are global**, so Facility Announcements
  live inside the layout, and the themed alert sounds are opt-in (above).
- **No error status for layouts.** A malfunction is announced as awaiting
  input. A failure is recognized by its exit code when the terminal ends.
  Agents started from Herdr's menus leave your shell open when they exit,
  so they are announced as departed rather than failed.
- **Announcements follow redraws.** While the window is minimized they wait
  until it is restored, and quick changes in between can merge.
- **Ctrl+Shift+X and the menu's Close skip the Boot Protocol**, on purpose,
  so Herdr's shortcuts keep working. The departure is announced as
  *terminated outside protocol*.
- **Barlow Condensed doesn't register** as its own family, so signage uses
  Barlow SemiBold and Bold.

## Compatibility

Tested with Herdr app 0.1.12 and herdr-core 0.1.17 on Windows 11. macOS
and Linux are untested, but handled: the header leaves room for the
traffic lights on macOS and draws window buttons only where the system
draws none.

## Development

```sh
npm test               # the event engine and GLaDOS lexicon (node --test)
node tools/art.mjs     # regenerate icons and pictures
node tools/sounds.mjs  # regenerate sounds (needs ffmpeg)
node tools/install.mjs
```

`aperture/` is the shareable layout folder: the layout, the mod,
[`RECIPE.md`](aperture/RECIPE.md) and `preview.png`. The agent contract is
in [`AGENTS.md`](AGENTS.md).

## License

MIT (see `LICENSE`), except the Barlow fonts in `aperture/mods/aperture/fonts/`,
which are under the SIL Open Font License 1.1 (`OFL.txt` beside them).
