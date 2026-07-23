import { Logo } from "@/components/brand/logo";

/**
 * First-paint splash for the installed PWA. Server-rendered so it appears
 * before hydration; CSS (see globals.css) fades it out after a beat and hides
 * it entirely on the plain website. No client JS.
 */
export function BootSplash() {
  return (
    <div className="boot-splash" aria-hidden>
      <Logo className="boot-splash__mark" />
      <span className="boot-splash__word">ওপেনখাতা</span>
    </div>
  );
}
