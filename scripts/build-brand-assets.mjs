import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "./brand/social";
mkdirSync(OUT, { recursive: true });

const S = 2; // supersample for crisp output

const BLUE = "#3446cb";
const BLUE_DEEP = "#212a9c";
const BLUE_LITE = "#5566e6";
const INDIGO_SOFT = "#c7d2fe";
const AMBER = "#f6c445";

const FLAME_OUTER =
  "M16.3 8.3c.8 3.8 4.8 5.8 4.8 9.9a5.1 5.1 0 0 1-10.2 0c0-1.6.5-2.9 1.4-3.8.3 1.6 1.3 2.6 2.2 2.6-1.3-2.9 0-5.8 1.8-8.7Z";
const FLAME_INNER =
  "M16.1 15c1.3 1.6 2.1 2.9 2.1 4.3a2.2 2.2 0 0 1-4.4 0c0-1 .5-1.8 1.3-2.5-.3 1 .3 1.6.8 1.6-.8-1.6-.3-3.2.2-4.8Z";
// Measured bbox of FLAME_OUTER on the 0..32 grid.
const FB = { w: 10.175, h: 14.975, cx: 15.9875, cy: 15.7875 };

/** Flame centred on (cx,cy) with a target height (px). */
function flameH(cx, cy, targetH, { fill = "#fff", inner = null, opacity = 1 } = {}) {
  const k = targetH / FB.h;
  const tx = cx - FB.cx * k;
  const ty = cy - FB.cy * k;
  const innerPath = inner ? `<path d="${FLAME_INNER}" fill="${inner}"/>` : "";
  return `<g transform="translate(${tx} ${ty}) scale(${k})" opacity="${opacity}">
    <path d="${FLAME_OUTER}" fill="${fill}"/>${innerPath}
  </g>`;
}

function defs() {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE_LITE}"/>
      <stop offset="0.55" stop-color="${BLUE}"/>
      <stop offset="1" stop-color="${BLUE_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.16" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="flameG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.68" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${AMBER}"/>
    </linearGradient>
  </defs>`;
}

/** capH = cap height px (Segoe UI cap-height ~0.72em). */
function wordmark(x, y, capH, { anchor = "start", forge = "#ffffff", spacing = 0 } = {}) {
  const fs = capH / 0.72;
  return `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-weight="700"
     font-size="${fs}" letter-spacing="${spacing}" text-anchor="${anchor}" fill="#ffffff">Career<tspan fill="${forge}">Forge</tspan></text>`;
}

function text(x, y, str, fs, { anchor = "start", fill = "#ffffff", weight = 400, spacing = 0, opacity = 1 } = {}) {
  return `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-weight="${weight}"
    font-size="${fs}" letter-spacing="${spacing}" text-anchor="${anchor}" fill="${fill}" opacity="${opacity}">${str}</text>`;
}

function pill(cx, cy, label, fs) {
  const padX = fs * 1.0;
  const w = label.length * fs * 0.55 + padX * 2;
  const h = fs * 2.0;
  const sw = Math.max(1.2, fs * 0.055);
  return `<g>
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#ffffff" opacity="0.13"/>
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="${sw}"/>
    ${text(cx, cy + fs * 0.34, label, fs, { anchor: "middle", weight: 600, spacing: fs * 0.02 })}
  </g>`;
}

function bg(w, h, deco = true) {
  const d = deco
    ? flameH(w * 0.9, h * 0.42, h * 1.15, { fill: "#ffffff", opacity: 0.055 }) +
      flameH(w * 0.06, h * 0.78, h * 0.85, { fill: "#ffffff", opacity: 0.05 })
    : "";
  return `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#glow)"/>${d}`;
}

async function render(name, w, h, inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * S}" height="${h * S}" viewBox="0 0 ${w} ${h}">${defs()}${inner}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${name}.png`);
  console.log(`  ${name}.png  ${w * S}x${h * S}`);
}

const TAG = "Build Your Career. Forge Your Future.";
const SUB = "AI CVs  \u00b7  Courses  \u00b7  Certificates  \u00b7  Coaching";
const URL = "careerforge.com.ng";

/* 1. Avatar — flame on brand blue rounded square (all platforms) */
await render("profile-blue-1080", 1080, 1080, `
  <rect width="1080" height="1080" rx="248" fill="url(#bg)"/>
  <rect width="1080" height="1080" rx="248" fill="url(#glow)"/>
  ${flameH(540, 548, 560, { fill: "#ffffff" })}
`);

/* 2. Mark only — white flame, transparent */
await render("mark-white-1024", 1024, 1024, flameH(512, 512, 780, { fill: "#ffffff" }));

/* 3. Mark only — two-tone flame, transparent */
await render("mark-blue-1024", 1024, 1024, flameH(512, 512, 780, { fill: "#ffffff", inner: BLUE }));

/* 4. Facebook cover 1640x924 (centred = safe on desktop + mobile crop) */
{
  const w = 1640, h = 924, cx = w / 2;
  await render("facebook-cover-1640x924", w, h, `
    ${bg(w, h)}
    ${flameH(cx, h * 0.235, 250, { fill: "url(#flameG)" })}
    ${wordmark(cx, h * 0.565, 96, { anchor: "middle", forge: INDIGO_SOFT, spacing: 1 })}
    ${text(cx, h * 0.685, TAG, 39, { anchor: "middle", fill: "#e7ebff", weight: 500, spacing: 0.4 })}
    ${pill(cx, h * 0.83, URL, 33)}
  `);
}

/* 5. Twitter / X header 1500x500 */
{
  const w = 1500, h = 500, cx = w / 2;
  await render("twitter-header-1500x500", w, h, `
    ${bg(w, h)}
    ${flameH(cx, h * 0.235, 150, { fill: "url(#flameG)" })}
    ${wordmark(cx, h * 0.60, 70, { anchor: "middle", forge: INDIGO_SOFT, spacing: 1 })}
    ${text(cx, h * 0.775, TAG, 29, { anchor: "middle", fill: "#e7ebff", weight: 500, spacing: 0.4 })}
    ${text(cx, h * 0.915, URL, 25, { anchor: "middle", fill: INDIGO_SOFT, weight: 600, spacing: 2 })}
  `);
}

/* 6. LinkedIn cover 1584x396 — horizontal lockup */
{
  const w = 1584, h = 396, pad = 120;
  await render("linkedin-cover-1584x396", w, h, `
    ${bg(w, h)}
    ${flameH(pad + 110, h / 2, 210, { fill: "url(#flameG)" })}
    ${wordmark(pad + 270, h * 0.47, 66, { forge: INDIGO_SOFT, spacing: 1 })}
    ${text(pad + 272, h * 0.66, TAG, 27, { fill: "#e7ebff", weight: 500, spacing: 0.3 })}
    ${text(pad + 274, h * 0.82, URL, 22, { fill: INDIGO_SOFT, weight: 600, spacing: 2 })}
  `);
}

/* 7. Instagram square post 1080x1080 — launch announcement */
{
  const w = 1080, h = 1080, cx = w / 2;
  await render("instagram-post-1080x1080", w, h, `
    ${bg(w, h)}
    ${text(cx, 178, "NOW LIVE", 33, { anchor: "middle", fill: AMBER, weight: 700, spacing: 9 })}
    ${flameH(cx, 430, 300, { fill: "url(#flameG)" })}
    ${wordmark(cx, 715, 96, { anchor: "middle", forge: INDIGO_SOFT, spacing: 1 })}
    ${text(cx, 800, TAG, 37, { anchor: "middle", fill: "#e7ebff", weight: 500, spacing: 0.4 })}
    ${text(cx, 858, SUB, 26, { anchor: "middle", fill: "#a9b4f2", weight: 500, spacing: 1 })}
    ${pill(cx, 952, URL, 33)}
  `);
}

/* 8. Open-graph / link preview 1200x630 */
{
  const w = 1200, h = 630, pad = 96;
  await render("og-image-1200x630", w, h, `
    ${bg(w, h)}
    ${flameH(pad + 130, h / 2, 300, { fill: "url(#flameG)" })}
    ${wordmark(pad + 300, h * 0.45, 82, { forge: INDIGO_SOFT, spacing: 1 })}
    ${text(pad + 302, h * 0.63, TAG, 33, { fill: "#e7ebff", weight: 500, spacing: 0.3 })}
    ${text(pad + 304, h * 0.78, URL, 25, { fill: INDIGO_SOFT, weight: 600, spacing: 2 })}
  `);
}

console.log("\nDone -> brand/social/");
