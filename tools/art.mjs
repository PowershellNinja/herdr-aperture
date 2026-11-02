// Writes every icon (one-colour, tinted by Herdr: icons/) and every picture
// (full colour: img/) the aperture mod uses. All original drawings.
//   node tools/art.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mod = join(dirname(fileURLToPath(import.meta.url)), "..", "aperture", "mods", "aperture");
const f = (n) => Math.round(n * 100) / 100;

const tinted = (body, sw = 1.3) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const ICONS = {
  "win-min": tinted(`<path d="M3.5 8.5h9"/>`, 1),
  "win-max": tinted(`<rect x="3.5" y="3.5" width="9" height="9"/>`, 1),
  "win-restore": tinted(`<rect x="3.5" y="5.5" width="7" height="7"/><path d="M5.5 5.5v-2h7v7h-2"/>`, 1),
  "win-close": tinted(`<path d="M4 4l8 8M12 4l-8 8"/>`, 1),
  "split-right": tinted(`<rect x="2" y="3" width="12" height="10" rx="1"/><path d="M8 3v10"/>`),
  "split-down": tinted(`<rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 8h12"/>`),
  zoom: tinted(`<path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"/>`),
  unzoom: tinted(`<path d="M6 3v3H3M10 3v3h3M6 13v-3H3M10 13v-3h3"/>`),
  plus: tinted(`<path d="M8 3v10M3 8h10"/>`, 1.6),
  close: tinted(`<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>`),
  // a test subject: a head and shoulders inside a monitoring frame
  subject: tinted(`<circle cx="8" cy="6" r="2.4"/><path d="M3.5 13.5c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4"/>`),
  records: tinted(`<rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>`),
  resume: tinted(`<path d="M5 3.5v9l7-4.5z"/>`),
  speaker: tinted(`<path d="M2.5 6v4h2.5l3.5 3V3L5 6z"/><path d="M10.5 5.5c.8.7 1.2 1.6 1.2 2.5s-.4 1.8-1.2 2.5M12.3 3.8c1.3 1.1 2 2.6 2 4.2s-.7 3.1-2 4.2"/>`),
  facility: tinted(`<rect x="2.5" y="2.5" width="11" height="11"/><path d="M2.5 6.5h11M6.5 6.5v7"/>`),
  boot: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5h4.2l.3 6.3 4.6 1.7c1 .4 1.6 1.2 1.6 2.2V13H1.6v-1.2c0-.6.4-1 .9-1.1l1-.2z"/><rect x="1.6" y="13.6" width="12.8" height="1.4" rx=".4"/></svg>`,
};

// The Enrichment Center mark: a six-bladed shutter around an orange opening.
function mark() {
  const c = 20, R = 18, r = 6.2;
  const v = [...Array(6)].map((_, k) => [c + r * Math.cos((Math.PI / 3) * k - Math.PI / 2), c + r * Math.sin((Math.PI / 3) * k - Math.PI / 2)]);
  const blades = v.map(([x, y], k) => {
    const [px, py] = v[(k + 5) % 6];
    const dx = x - px, dy = y - py, n = Math.hypot(dx, dy);
    return `<path d="M${f(x)} ${f(y)}L${f(x + (dx / n) * 15.5)} ${f(y + (dy / n) * 15.5)}"/>`;
  }).join("");
  const hex = v.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
<circle cx="${c}" cy="${c}" r="${R}" fill="#1b2024"/>
<g stroke="#f4f4f0" stroke-width="1.7" stroke-linecap="round">${blades}</g>
<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#1b2024" stroke-width="2.4"/>
<polygon points="${hex}" fill="#ff8a00"/>
</svg>`;
}

// The monitor's optic: a housing ring, a dark iris and a warm core.
const optic = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
<defs><radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff4c2"/><stop offset=".35" stop-color="#ffd24a"/><stop offset=".8" stop-color="#ff8a00"/><stop offset="1" stop-color="#b85a00"/></radialGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb000" stop-opacity=".55"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient></defs>
<circle cx="32" cy="32" r="31" fill="#d7d9d4"/><circle cx="32" cy="32" r="31" fill="none" stroke="#8d9396" stroke-width="1.5"/>
<circle cx="32" cy="32" r="25" fill="#0d1114"/><circle cx="32" cy="32" r="25" fill="none" stroke="#3a454d" stroke-width="2"/>
<circle cx="32" cy="32" r="18" fill="url(#glow)"/>
<circle cx="32" cy="32" r="9" fill="url(#core)"/>
<circle cx="28.5" cy="28.5" r="2.2" fill="#ffffff" opacity=".8"/>
<path d="M32 4v5M32 55v5M4 32h5M55 32h5" stroke="#8d9396" stroke-width="2"/>
</svg>`;

// A cake: three layers, frosting, a single candle. Delivery not included.
const cake = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<ellipse cx="48" cy="84" rx="40" ry="7" fill="#c9ccc8"/><ellipse cx="48" cy="82" rx="40" ry="7" fill="#f4f4f0" stroke="#8d9396"/>
<path d="M16 50h64v28c0 4-14 7-32 7s-32-3-32-7z" fill="#5a3422"/>
<path d="M16 62h64v4c0 3-14 5-32 5s-32-2-32-5z" fill="#f2d7e0"/>
<ellipse cx="48" cy="50" rx="32" ry="7" fill="#fbe9ef"/>
<path d="M16 50c0 4 2 9 5 9s3-6 6-6 3 9 7 9 3-7 7-7 3 8 7 8 3-8 7-8 3 7 7 7 3-8 6-8 3 5 5 5 4-5 4-9" fill="#fbe9ef"/>
<circle cx="30" cy="47" r="3.2" fill="#d7263d"/><circle cx="48" cy="45" r="3.2" fill="#d7263d"/><circle cx="66" cy="47" r="3.2" fill="#d7263d"/>
<rect x="45.5" y="24" width="5" height="20" rx="1" fill="#2fa8e0"/><path d="M45.5 28l5-3M45.5 34l5-3M45.5 40l5-3" stroke="#f4f4f0" stroke-width="1.4"/>
<path d="M48 10c4 5 5 8 2.5 11.5-1.5 2-4 2-5 0C43.5 18 46 15 48 10z" fill="#ffb000"/><path d="M48 15c1.6 2.4 2 4 .8 5.5-.7.8-1.8.8-2.2 0-.8-1.4.2-3 1.4-5.5z" fill="#fff4c2"/>
</svg>`;

// The boot used by the Boot Protocol: grey leather, orange sole.
const boot = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<path d="M26 8h26l2 40 26 9c6 2 10 7 10 13v6H8v-8c0-4 3-6 6-7l8-2z" fill="#5c656b" stroke="#1b2024" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M27 16h24M27 24h24M28 32h24" stroke="#c4ccd1" stroke-width="2"/>
<path d="M8 76h82v6c0 2-1 4-4 4H12c-3 0-4-2-4-4z" fill="#ff8a00" stroke="#1b2024" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M54 50c-6 4-10 10-10 18" fill="none" stroke="#1b2024" stroke-width="2"/>
</svg>`;

const hazard = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
<path d="M24 4l21 38H3z" fill="#ff8a00" stroke="#1b2024" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M24 17v13" stroke="#1b2024" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="36" r="2.6" fill="#1b2024"/>
</svg>`;

await mkdir(join(mod, "icons"), { recursive: true });
await mkdir(join(mod, "img"), { recursive: true });
for (const [n, s] of Object.entries(ICONS)) await writeFile(join(mod, "icons", `${n}.svg`), s + "\n");
for (const [n, s] of Object.entries({ mark: mark(), optic, cake, boot, hazard })) await writeFile(join(mod, "img", `${n}.svg`), s + "\n");
console.log(`Wrote ${Object.keys(ICONS).length} icons and 5 pictures to ${mod}`);
