"use client";

import { useEffect } from "react";

/**
 * iOS Safari has ignored `user-scalable=no` since iOS 10, so the viewport meta
 * alone does not switch zoom off there. Cancelling the Safari-only `gesture*`
 * events (pinch) and any multi-touch `touchmove` covers what the meta misses.
 * Double-tap-to-zoom is handled in CSS by `touch-action: manipulation`.
 */
export function NoZoom() {
  useEffect(() => {
    const cancel = (e: Event) => e.preventDefault();

    // Safari-only: fires for pinch on the page itself.
    document.addEventListener("gesturestart", cancel);
    document.addEventListener("gesturechange", cancel);
    document.addEventListener("gestureend", cancel);

    // Second finger down means a pinch, never a scroll — single-finger
    // scrolling passes straight through, so lists keep working.
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", cancel);
      document.removeEventListener("gesturechange", cancel);
      document.removeEventListener("gestureend", cancel);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
