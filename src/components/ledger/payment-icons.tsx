import { FaTelegramPlane } from "react-icons/fa";

/**
 * Brand icons for payment methods. lucide has no MFS brand marks, so bKash and
 * Nagad use locally-bundled logo files (offline-first — no remote fetch), and
 * Rocket uses react-icons' Telegram-plane glyph tinted with Rocket's purple.
 *
 * Drop the brand files here (square, transparent background) — the paths below
 * are the only place to change if you rename them:
 *   public/brand/bkash.png
 *   public/brand/nagad.png
 */

export type PaymentIconProps = {
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
};

function LogoImg({
  src,
  size = 16,
  className,
  style,
}: PaymentIconProps & { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
      draggable={false}
    />
  );
}

export function BkashIcon(props: PaymentIconProps) {
  return <LogoImg src="/brand/bkash.png" {...props} />;
}

export function NagadIcon(props: PaymentIconProps) {
  return <LogoImg src="/brand/nagad.png" {...props} />;
}

/** Rocket has no react-icons brand glyph; its logo is a paper-plane in purple. */
export function RocketIcon({ size = 16, className, style }: PaymentIconProps) {
  return (
    <FaTelegramPlane
      size={size}
      className={className}
      style={style}
      aria-hidden
    />
  );
}
