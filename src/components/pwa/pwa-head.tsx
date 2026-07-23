/**
 * iOS PWA launch images (apple-touch-startup-image). Android derives its splash
 * from the manifest (icon + name + background_color), but iOS needs one tagged
 * <link> per device resolution. PNGs are produced by `npm run generate:icons`.
 *
 * These tags are rendered into the document head by Next's tag hoisting.
 */

// [cssWidth, cssHeight, devicePixelRatio] — pixel size is css * dpr.
const DEVICES: [number, number, number][] = [
  [430, 932, 3], // 15/14 Pro Max
  [393, 852, 3], // 15/14 Pro
  [428, 926, 3], // 13/12 Pro Max
  [390, 844, 3], // 13/12 / 14
  [375, 812, 3], // X / XS / 11 Pro
  [414, 896, 3], // XS Max / 11 Pro Max
  [414, 896, 2], // XR / 11
  [414, 736, 3], // 8 Plus
  [375, 667, 2], // SE (2/3) / 8
  [320, 568, 2], // SE (1st gen)
];

export function PwaHead() {
  return (
    <>
      {DEVICES.map(([w, h, ratio]) => {
        const px = w * ratio;
        const py = h * ratio;
        return (
          <link
            key={`${px}x${py}`}
            rel="apple-touch-startup-image"
            href={`/splash/apple-splash-${px}-${py}.png`}
            media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`}
          />
        );
      })}
    </>
  );
}
