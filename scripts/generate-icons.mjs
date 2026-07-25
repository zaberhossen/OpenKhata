/*
 * Generates the PWA icon + splash set from the brand logo.
 *
 * Source of truth is the OpenKhata mark. By default it rasterizes the vector
 * at `public/brand/logo.svg`. If you have the exact pixel art, drop it at
 * `public/brand/logo.png` (square, transparent or white bg) and it will be
 * preferred automatically — no code change needed.
 *
 * Rasterization uses `rsvg-convert` (librsvg). Install once with:
 *   brew install librsvg           # macOS
 *   apt-get install librsvg2-bin   # Debian/Ubuntu
 *
 * Rerun with `npm run generate:icons` after changing the logo or brand tokens.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- Brand tokens (keep in sync with globals.css / manifest) ------------
const BG = "#f8fafc"; // slate-50 — matches manifest background_color
const WHITE = "#ffffff";
const BRAND = "#0D9488"; // teal-600 — matches the brand mark & --color-primary

// --- Logo source: prefer the exact PNG, fall back to the vector ----------
const pngSource = join(root, "public/brand/logo.png");
const svgSource = join(root, "public/brand/logo.svg");

/** Returns an SVG fragment that draws the logo inside a box at (x,y,size). */
function logoFragment(x, y, size) {
  if (existsSync(pngSource)) {
    const b64 = readFileSync(pngSource).toString("base64");
    return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/png;base64,${b64}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  // Inline the vector, stripped of its outer <svg> wrapper, into a nested <svg>.
  const inner = readFileSync(svgSource, "utf8")
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 512 512">${inner}</svg>`;
}

function rasterize(svg, size, outPath) {
  const target = join(root, outPath);
  mkdirSync(dirname(target), { recursive: true });
  const png = execFileSync(
    "rsvg-convert",
    ["-w", String(size), "-h", String(size)],
    { input: svg, maxBuffer: 64 * 1024 * 1024 },
  );
  writeFileSync(target, png);
  console.log(`✓ ${outPath} (${size}x${size})`);
}

// --- Icon compositions ---------------------------------------------------

/** Rounded-tile icon (purpose "any"): mark on a light rounded square. */
function tileIcon(size) {
  const r = Math.round(size * 0.22);
  const pad = Math.round(size * 0.14);
  const logo = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${WHITE}"/>
    ${logoFragment(pad, pad, logo)}
  </svg>`;
}

/** Maskable icon: full-bleed light background, mark inside the 80% safe zone. */
function maskableIcon(size) {
  const pad = Math.round(size * 0.19);
  const logo = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${WHITE}"/>
    ${logoFragment(pad, pad, logo)}
  </svg>`;
}

/** Small favicon: mark on a light rounded tile, minimal padding. */
function faviconIcon(size) {
  const r = Math.round(size * 0.2);
  const pad = Math.round(size * 0.08);
  const logo = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${WHITE}"/>
    ${logoFragment(pad, pad, logo)}
  </svg>`;
}

const icons = [
  ["public/icons/icon-192.png", 192, tileIcon(192)],
  ["public/icons/icon-512.png", 512, tileIcon(512)],
  ["public/icons/icon-maskable-192.png", 192, maskableIcon(192)],
  ["public/icons/icon-maskable-512.png", 512, maskableIcon(512)],
  ["public/icons/apple-touch-icon.png", 180, faviconIcon(180)],
  ["src/app/icon.png", 64, faviconIcon(64)],
];

for (const [path, size, svg] of icons) rasterize(svg, size, path);

// --- iOS splash screens (apple-touch-startup-image) ----------------------
// Portrait launch images: brand background with the centered mark + wordmark.
// Device list covers current + recent iPhones; unmatched devices fall back to
// the manifest background_color, so a miss just means no logo (never a crash).
const SPLASH = [
  [1290, 2796],
  [1179, 2556],
  [1284, 2778],
  [1170, 2532],
  [1125, 2436],
  [1242, 2688],
  [828, 1792],
  [1242, 2208],
  [750, 1334],
  [640, 1136],
];

function splashScreen(w, h) {
  const logo = Math.round(Math.min(w, h) * 0.42);
  const lx = Math.round((w - logo) / 2);
  const ly = Math.round(h / 2 - logo * 0.62);
  const wordY = ly + logo + Math.round(logo * 0.26);
  const wordSize = Math.round(logo * 0.16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${BG}"/>
    ${logoFragment(lx, ly, logo)}
    <text x="${w / 2}" y="${wordY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${wordSize}" font-weight="700" fill="${BRAND}" letter-spacing="1">OpenKhata</text>
  </svg>`;
}

for (const [w, h] of SPLASH) {
  const outPath = `public/splash/apple-splash-${w}-${h}.png`;
  const target = join(root, outPath);
  mkdirSync(dirname(target), { recursive: true });
  const png = execFileSync("rsvg-convert", ["-w", String(w), "-h", String(h)], {
    input: splashScreen(w, h),
    maxBuffer: 128 * 1024 * 1024,
  });
  writeFileSync(target, png);
  console.log(`✓ ${outPath}`);
}
