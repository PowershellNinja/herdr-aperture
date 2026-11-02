// Copies the layout and its mod into the Herdr home (HERDR_APP_HOME, else
// ~/.config/herdr-app). Only ever writes layouts/aperture.json and
// mods/aperture/; files Herdr writes into the mod folder (.d.ts,
// jsconfig.json) are left alone.
import { cp, readdir, rm, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "aperture");
const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const HERDR_OWNED = (name) => name.endsWith(".d.ts") || name === "jsconfig.json";

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function files(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p, base)));
    else out.push(relative(base, p));
  }
  return out;
}

if (!(await exists(join(home, "AGENTS.md")))) {
  console.error(`No Herdr home at ${home} (set HERDR_APP_HOME).`);
  process.exit(1);
}

const srcMod = join(repo, "mods", "aperture");
const dstMod = join(home, "mods", "aperture");
await mkdir(dstMod, { recursive: true });

// Remove files we shipped before and no longer ship.
const keep = new Set(await files(srcMod));
if (await exists(dstMod)) {
  for (const f of await files(dstMod)) {
    if (!keep.has(f) && !HERDR_OWNED(f.split(/[\\/]/).pop())) await rm(join(dstMod, f));
  }
}
await cp(srcMod, dstMod, { recursive: true, filter: (p) => !HERDR_OWNED(p.split(/[\\/]/).pop()) });
await cp(join(repo, "layouts", "aperture.json"), join(home, "layouts", "aperture.json"));
console.log(`Installed aperture into ${home}`);
