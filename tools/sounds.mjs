// Synthesizes the layout's sounds with FFmpeg (no samples, all original):
//   node tools/sounds.mjs
// online  facility chime when the monitoring terminal comes up
// arrive  pneumatic delivery when a test subject arrives
// thunk   relay clunk when a subject is ended outside the Boot Protocol
// fail    two low buzzes when a test fails
// boot    swing and thud of the Boot Protocol
// tick    a faint relay tick for buttons that start or resume something
// cake / blocked  optional replacements for Herdr's own done / blocked
//                 sounds (settings.json "sounds"; see README)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "aperture", "mods", "aperture", "sounds");
mkdirSync(out, { recursive: true });

// tone(f, at, decay, gain): a sine from `at` seconds on, fading exponentially.
const tone = (f, at, decay, gain) => `${gain}*sin(2*PI*${f}*(t-${at}))*exp(-${decay}*(t-${at}))*gte(t,${at})`;
const noise = (gain, decay, at = 0) => `${gain}*(random(0)*2-1)*exp(-${decay}*(t-${at}))*gte(t,${at})`;

const SOUNDS = {
  online: { d: 1.4, expr: [tone(659, 0, 5, 0.22), tone(988, 0.2, 3.5, 0.2), tone(1319, 0.2, 4, 0.05)], filter: "lowpass=f=5000" },
  arrive: { d: 0.6, expr: [noise(0.16, 10), `0.18*sin(2*PI*(380+700*t)*t)*exp(-7*t)`], filter: "bandpass=f=900:width_type=o:w=2" },
  thunk: { d: 0.4, expr: [`0.3*sin(2*PI*(95-60*t)*t)*exp(-13*t)`, noise(0.08, 40)], filter: "lowpass=f=1200" },
  fail: { d: 0.6, expr: [`0.08*sgn(sin(2*PI*104*t))*(lt(t,0.18)+between(t,0.27,0.47))`], filter: "lowpass=f=1400" },
  boot: { d: 0.9, expr: [`0.14*(random(0)*2-1)*exp(-((t-0.16)^2)/0.004)`, tone(68, 0.3, 11, 0.36), noise(0.12, 30, 0.3)], filter: "lowpass=f=2400" },
  tick: { d: 0.08, expr: [noise(0.2, 90), tone(2400, 0, 60, 0.05)], filter: "highpass=f=800" },
  cake: { d: 1.4, expr: [tone(1047, 0, 4, 0.13), tone(1319, 0.15, 4, 0.13), tone(1568, 0.3, 3, 0.15), tone(2093, 0.3, 4, 0.03)], filter: "lowpass=f=6000" },
  blocked: { d: 1.0, expr: [tone(880, 0, 5, 0.17), tone(659, 0.2, 4, 0.17)], filter: "lowpass=f=5000" },
};

for (const [name, s] of Object.entries(SOUNDS)) {
  const src = `aevalsrc='${s.expr.join("+")}':s=44100:d=${s.d}`;
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "lavfi", "-i", src,
    "-af", `${s.filter},afade=t=out:st=${(s.d - 0.08).toFixed(2)}:d=0.08`,
    "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", join(out, `${name}.mp3`)]);
}
console.log(`Wrote ${Object.keys(SOUNDS).length} sounds to ${out}`);
