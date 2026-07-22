import QRCode from "qrcode";

/**
 * QR generation (Phase 4, Step 2). Fully offline — `qrcode` is bundled, no
 * network. We render to an SVG string so it stays crisp at any size and needs
 * no canvas. Colours use currentColor-friendly hex so it reads in print too.
 */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
