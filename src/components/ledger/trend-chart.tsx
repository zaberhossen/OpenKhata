"use client";

import { formatTaka } from "@/lib/money";
import type { TrendBucket } from "@/lib/reports";
import { useMemo, useState } from "react";

/**
 * পেলাম vs দিলাম over time, as a grouped column chart.
 *
 * Hand-rolled SVG rather than a charting library: the whole app is 87 kB of
 * shared JS and has to install over a flaky 3G connection, so a ~100 kB
 * dependency for one chart is not a trade worth making. It also renders on the
 * server and prints (the রিপোর্ট page has a প্রিন্ট / PDF button) with no work.
 *
 * The two bar colors are validated as a categorical pair — see the note on
 * --color-chart-gave in globals.css for why the red is a step darker than the
 * red used elsewhere in the app.
 */

// viewBox units. The SVG scales uniformly to its container, so these are
// "about pixels" on a phone-width card (320 units ≈ 400 css px).
const VB_W = 320;
const VB_H = 150;
const PAD = { top: 8, right: 4, bottom: 18, left: 34 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;

/** 2px of surface between the two bars of a group, in viewBox units. */
const BAR_GAP = 1.6;
/** Bars never fill their band — the leftover is deliberate air. */
const BAND_FILL = 0.68;
const MAX_BAR_W = 24;

const compact = new Intl.NumberFormat("bn-BD", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Round an axis maximum up to a clean 1 / 2 / 5 × 10ⁿ so ticks read well. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * A column with a rounded cap and square feet — a plain `rx` would round the
 * baseline too and lift the bar off its own axis. The radius shrinks with the
 * bar so short or thin columns don't turn into lozenges.
 */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(3, w / 2, h);
  return (
    `M${x},${y + h}` +
    `L${x},${y + r}` +
    `Q${x},${y} ${x + r},${y}` +
    `L${x + w - r},${y}` +
    `Q${x + w},${y} ${x + w},${y + r}` +
    `L${x + w},${y + h}Z`
  );
}

const SERIES = [
  { key: "got", label: "পেলাম", className: "fill-chart-got" },
  { key: "gave", label: "দিলাম", className: "fill-chart-gave" },
] as const;

export function TrendChart({ buckets }: { buckets: TrendBucket[] }) {
  const [active, setActive] = useState<number | null>(null);

  const { peak, max, band, barW, ticks, labelEvery } = useMemo(() => {
    const peak = Math.max(0, ...buckets.flatMap((b) => [b.got, b.gave]));
    const max = niceMax(peak);
    const band = PLOT_W / Math.max(buckets.length, 1);
    const barW = Math.min(
      MAX_BAR_W,
      Math.max(1, (band * BAND_FILL - BAR_GAP) / 2),
    );
    return {
      peak,
      max,
      band,
      barW,
      ticks: [max, max / 2],
      // Thin out x labels until they stop colliding (~6 fit across a phone).
      labelEvery: Math.ceil(buckets.length / 6),
    };
  }, [buckets]);

  // A single bucket is a stat tile, not a chart — the totals above already say
  // it. An all-zero range has nothing to plot at all: empty axes with a "০"
  // on every tick read like a broken chart rather than like "no activity".
  if (buckets.length < 2 || peak <= 0) return null;

  const shown = active !== null ? buckets[active] : null;
  const yOf = (value: number) => PAD.top + PLOT_H - (value / max) * PLOT_H;

  return (
    <section className="mt-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text-muted">
        {buckets[0].key.length > 7 ? "দিনভিত্তিক" : "মাসভিত্তিক"} লেনদেন
      </h2>

      {/*
       * The readout is the tooltip: on a phone there is no hover, and a
       * floating box would sit under the thumb that opened it. Fixed height so
       * selecting a bar doesn't shove the chart down the page.
       */}
      <div className="mt-1 flex min-h-[1.5rem] flex-wrap items-center gap-x-3 gap-y-0.5">
        {shown ? (
          <>
            <span className="text-xs text-text-muted">{shown.fullLabel}</span>
            {SERIES.map(({ key, label, className }) => (
              <span key={key} className="flex items-center gap-1.5 text-sm">
                <svg width="9" height="9" aria-hidden className={className}>
                  <rect width="9" height="9" rx="2" />
                </svg>
                <span className="text-text-muted">{label}</span>
                <span className="font-semibold">{formatTaka(shown[key])}</span>
              </span>
            ))}
          </>
        ) : (
          <span className="text-xs text-text-muted">
            বিস্তারিত দেখতে বারে চাপুন
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="mt-2 h-auto w-full touch-manipulation"
        role="img"
        aria-label={`পেলাম ও দিলাম-এর সময়ভিত্তিক তুলনা, ${buckets.length}টি ভাগে। বিস্তারিত সংখ্যা নিচের তালিকায় আছে।`}
        onPointerLeave={() => setActive(null)}
      >
        {/* Gridlines sit under the marks and stay recessive — hairline, solid. */}
        {[0, ...ticks].map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            x2={VB_W - PAD.right}
            y1={yOf(tick)}
            y2={yOf(tick)}
            className="stroke-border"
            strokeWidth={0.7}
          />
        ))}
        {ticks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 5}
            y={yOf(tick) + 3}
            textAnchor="end"
            className="fill-text-muted text-[8px]"
          >
            {compact.format(tick / 100)}
          </text>
        ))}

        {buckets.map((bucket, i) => {
          const bandX = PAD.left + i * band;
          const groupX = bandX + (band - (barW * 2 + BAR_GAP)) / 2;
          return (
            <g key={bucket.key}>
              {active === i && (
                <rect
                  x={bandX}
                  y={PAD.top}
                  width={band}
                  height={PLOT_H}
                  className="fill-background"
                />
              )}

              {SERIES.map(({ key, className }, s) => {
                const value = bucket[key];
                if (value <= 0) return null;
                const h = (value / max) * PLOT_H;
                return (
                  <path
                    key={key}
                    d={columnPath(
                      groupX + s * (barW + BAR_GAP),
                      PAD.top + PLOT_H - h,
                      barW,
                      h,
                    )}
                    className={className}
                  />
                );
              })}

              {i % labelEvery === 0 && (
                <text
                  x={bandX + band / 2}
                  y={VB_H - 6}
                  textAnchor="middle"
                  className="fill-text-muted text-[8px]"
                >
                  {bucket.label}
                </text>
              )}

              {/* Full-height hit target — far bigger than the bars it selects. */}
              <rect
                x={bandX}
                y={0}
                width={band}
                height={VB_H}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              />
            </g>
          );
        })}

        {/* Baseline drawn last so the bars sit on it, not over it. */}
        <line
          x1={PAD.left}
          x2={VB_W - PAD.right}
          y1={yOf(0)}
          y2={yOf(0)}
          className="stroke-text-muted"
          strokeWidth={0.7}
        />
      </svg>

      {/* Two series, so a legend is always present — identity is never
          carried by color alone. */}
      <div className="mt-2 flex justify-center gap-4 text-xs text-text-muted">
        {SERIES.map(({ key, label, className }) => (
          <span key={key} className="flex items-center gap-1.5">
            <svg width="9" height="9" aria-hidden className={className}>
              <rect width="9" height="9" rx="2" />
            </svg>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
