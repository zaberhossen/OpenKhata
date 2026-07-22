"use client";

import { useEffect, useState } from "react";
import { qrSvg } from "@/lib/qr";

/** Renders `value` as a QR code (inline SVG). Regenerates when value changes. */
export function QrCode({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    qrSvg(value)
      .then((markup) => alive && setSvg(markup))
      .catch(() => alive && setSvg(null));
    return () => {
      alive = false;
    };
  }, [value]);

  return (
    <div
      aria-label="QR কোড"
      role="img"
      className={className}
      // qrSvg output is a static SVG we generate ourselves — no user markup.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
