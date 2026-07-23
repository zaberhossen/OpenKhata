/**
 * The OpenKhata brand mark: an open book whose left page carries a Bengali
 * "রি" and whose right page is an open padlock (your data, unlocked & offline).
 *
 * Rendered from the shared static asset `public/brand/logo.svg` — the same
 * source the PWA icons and splash screens are generated from
 * (`npm run generate:icons`) — so the logo stays identical everywhere and the
 * (large, hand-traced) vector is fetched once and cached, not inlined per page.
 */
export function Logo({
  className,
  title = "ওপেনখাতা",
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark, no layout benefit from next/image
    <img
      src="/brand/logo.svg"
      alt={title}
      width={512}
      height={512}
      className={className}
      draggable={false}
    />
  );
}
