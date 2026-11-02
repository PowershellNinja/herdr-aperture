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

test("an unnamed tab is called after its subject's session", () => {
  const tab = { id: "tb2", name: "2", named: false };
  assert.equal(testName(tab, [claude("Echoes Lyra Origin Story")]), "Echoes Lyra Origin Story");
});

test("a tab someone named keeps that name", () => {
  const tab = { id: "tb2", name: "Herdr Aperture", named: true };
  assert.equal(testName(tab, [claude("Echoes Lyra Origin Story")]), "Herdr Aperture");
});

test("an unnamed tab without a named session has no name", () => {
  const tab = { id: "tb2", name: "2", named: false };
  assert.equal(testName(tab, []), null);
  assert.equal(testName(tab, [claude("Claude Code")]), null);
  assert.equal(testName(tab, [claude("Elsewhere", { tab: "tb9" })]), null);
});

test("with several subjects in a tab, the focused one names it", () => {
  const tab = { id: "tb2", name: "2", named: false };
  const subjects = [claude("First session"), claude("Focused session", { address: "t2", focused: true })];
  assert.equal(testName(tab, subjects), "Focused session");
});
