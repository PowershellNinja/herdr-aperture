import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionName, testName } from "../aperture/mods/aperture/names.js";

const claude = (title, extra = {}) => ({ address: "t1", tab: "tb2", title, focused: false, program: { name: "Claude Code", agent: true }, ...extra });

test("a shell's title is not a session name", () => {
  assert.equal(sessionName({ address: "t1g", title: "t1g", program: { name: "pwsh", agent: false, shell: true } }), null);
  assert.equal(sessionName({ address: "t5", title: "C:\\Users\\me", program: { name: "pwsh", shell: true } }), null);
});

test("a Claude session's title is its name", () => {
  assert.equal(sessionName(claude("Echoes Lyra Origin Story")), "Echoes Lyra Origin Story");
});

test("status glyphs an agent puts before its title are dropped", () => {
  assert.equal(sessionName(claude("✳ Herdr GLaDOS layout")), "Herdr GLaDOS layout");
  assert.equal(sessionName(claude("⠐ Work IQ fetch binding")), "Work IQ fetch binding");
});

test("a title that says nothing about the session is no name", () => {
  assert.equal(sessionName(claude("")), null);
  assert.equal(sessionName(claude("✳ ")), null);
  assert.equal(sessionName(claude("Claude Code")), null);
  assert.equal(sessionName(claude(undefined)), null);
});

// Tabs are named from their panes (panes() entries: pane, terminal, tab, title, focused, program).
const tab = { id: "tb2", name: "2", named: false };
const agentPane = (title, extra = {}) => ({ pane: "p1", terminal: "t1", tab: "tb2", title, focused: false, program: { name: "Claude Code", agent: true }, ...extra });
const shellPane = (title, extra = {}) => ({ pane: "p2", terminal: "t1c", tab: "tb2", title, focused: false, program: { name: "pwsh", agent: false, shell: true }, ...extra });

test("an unnamed tab is called after its subject's session", () => {
  assert.equal(testName(tab, [agentPane("Echoes Lyra Origin Story")]), "Echoes Lyra Origin Story");
});

test("a tab someone named keeps that name", () => {
  assert.equal(testName({ ...tab, name: "Herdr Aperture", named: true }, [agentPane("Echoes Lyra Origin Story")]), "Herdr Aperture");
});

test("an unnamed tab without a meaningful title has no name", () => {
  assert.equal(testName(tab, []), null);
  assert.equal(testName(tab, [agentPane("Claude Code")]), null);
  assert.equal(testName(tab, [agentPane("Elsewhere", { tab: "tb9" })]), null);
});

test("with several panes in a tab, the focused one names it", () => {
  const panes = [agentPane("First session"), agentPane("Focused session", { pane: "p3", terminal: "t2", focused: true })];
  assert.equal(testName(tab, panes), "Focused session");
});

test("a shell showing a session (an attached background agent) names its tab", () => {
  assert.equal(testName(tab, [shellPane("✳ ContextForge to Agentgateway migration")]), "ContextForge to Agentgateway migration");
});

test("a shell's own address, folder or program name does not name a tab", () => {
  assert.equal(testName(tab, [shellPane("t1c")]), null);
  assert.equal(testName(tab, [shellPane("C:\\Users\\me\\repo")]), null);
  assert.equal(testName(tab, [shellPane("~/repo")]), null);
  assert.equal(testName(tab, [shellPane("/home/me/repo")]), null);
  assert.equal(testName(tab, [shellPane("pwsh")]), null);
});

test("a mod pane's title is its mod, not a name", () => {
  assert.equal(testName(tab, [{ pane: "p4", terminal: null, mod: "files", tab: "tb2", title: "Files", focused: true }]), null);
});

test("an agent's session wins over another pane's title when neither is focused", () => {
  assert.equal(testName(tab, [shellPane("vim notes.md"), agentPane("Agent session")]), "Agent session");
});
