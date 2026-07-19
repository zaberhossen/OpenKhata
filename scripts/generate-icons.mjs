/*
 * Generates the PWA icon set as PNGs with zero dependencies (raw zlib PNG
 * encoding). The mark is a white ledger book with ruled lines on the brand
 * teal. Rerun with `npm run generate:icons` after changing brand tokens.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const TEAL = [13, 148, 136];
const TEAL_DARK = [15, 118, 110];
const WHITE = [255, 255, 255];

// --- Minimal PNG encoder -----------------------------------------------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Drawing (signed distance, 3x3 supersampled) ------------------------

function roundedRectDist(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r);
  const dy = Math.abs(py - cy) - (hh - r);
  const ox = Math.max(dx, 0);
  const oy = Math.max(dy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0) - r;
}

function render(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  // Maskable icons must bleed to the edge; regular ones get a rounded tile.
  const tileRadius = maskable ? 0 : size * 0.2;
  // Keep the mark inside the maskable safe zone (inner 80%).
  const s = maskable ? 0.72 : 1;

  const layers = [
    // [color, distance fn]
    [
      TEAL,
      (x, y) => roundedRectDist(x, y, 0.5, 0.5, 0.5, 0.5, tileRadius / size),
    ],
    // Book cover
    [
      TEAL_DARK,
      (x, y) => roundedRectDist(x, y, 0.5, 0.52, 0.31 * s, 0.34 * s, 0.05 * s),
    ],
    // Page
    [
      WHITE,
      (x, y) => roundedRectDist(x, y, 0.5, 0.48, 0.27 * s, 0.3 * s, 0.04 * s),
    ],
    // Ruled lines
    ...[0.38, 0.48, 0.58].map((ly) => [
      TEAL,
      (x, y) =>
        roundedRectDist(
          x,
          y,
          0.5,
          ly * s + 0.5 * (1 - s),
          0.18 * s,
          0.018 * s,
          0.018 * s,
        ),
    ]),
  ];

  const SS = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) / size;
          const py = (y + (sy + 0.5) / SS) / size;
          let color = null;
          for (const [c, dist] of layers) {
            if (dist(px, py) <= 0) color = c;
          }
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      const alpha = a / n;
      const covered = a / 255 || 1;
      rgba[i] = r / covered;
      rgba[i + 1] = g / covered;
      rgba[i + 2] = b / covered;
      rgba[i + 3] = alpha;
    }
  }
  return encodePng(size, rgba);
}

const outputs = [
  ["public/icons/icon-192.png", 192, { maskable: false }],
  ["public/icons/icon-512.png", 512, { maskable: false }],
  ["public/icons/icon-maskable-192.png", 192, { maskable: true }],
  ["public/icons/icon-maskable-512.png", 512, { maskable: true }],
  ["public/icons/apple-touch-icon.png", 180, { maskable: true }],
  ["src/app/icon.png", 64, { maskable: false }],
];

for (const [path, size, opts] of outputs) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, render(size, opts));
  console.log(`✓ ${path} (${size}x${size})`);
}
