// The link preview (Open Graph and Twitter card), drawn once at build time.
// The only file where colors are written as hex: this image is rendered outside the page, so it
// can't read the theme's CSS variables. The values are copied from app/globals.css; keep them in step.
import { ImageResponse } from "next/og";

export const alt = "Fourcast: know tonight if tomorrow's payment will clear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1f1a"; // --foreground
const PAPER = "#f5f7f4"; // --background
const GREEN = "#0b6e4f"; // --primary
const SUN = "#fcefd3"; // --tight-soft
const SHORT_SOFT = "#fde4d8"; // --short-soft
const SHORT = "#b83e0b"; // --short
const OK_SOFT = "#dff2e8"; // --ok-soft
const MUTED = "#4f5f58"; // --muted-foreground

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* The mark from components/logo.tsx */}
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill={GREEN} />
            <path
              d="M16 6.5 6.5 19h20M16 6.5v19"
              fill="none"
              stroke={PAPER}
              strokeWidth="3.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M19 17.4a4 4 0 0 1 8 0z" fill={SUN} />
          </svg>
          <div style={{ display: "flex", fontSize: 52, letterSpacing: -2 }}>
            <span>four</span>
            {/* Two spans leave a word gap in the image renderer; pull the second one back. */}
            <span style={{ color: GREEN, marginLeft: -8 }}>cast</span>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 84, lineHeight: 1.08, letterSpacing: -3, maxWidth: 1000 }}>
          Know tonight if tomorrow’s payment will clear
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <div style={{ display: "flex", padding: "12px 22px", borderRadius: 999, background: SHORT_SOFT, color: SHORT }}>
            Autopay at 6 am
          </div>
          <div style={{ display: "flex", padding: "12px 22px", borderRadius: 999, background: OK_SOFT, color: GREEN }}>
            Paycheck at 3 pm
          </div>
          <div style={{ display: "flex", marginLeft: 8, color: MUTED }}>Klarna, Afterpay, Affirm, Zip</div>
        </div>
      </div>
    ),
    size,
  );
}
