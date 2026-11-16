import type { CSSProperties } from "react";
import type { MarketDTO } from "./types";

const LABEL = "#1c1c1e";

/** Relative luminance of a #rrggbb colour (WCAG 2 formula). */
function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** White or the label colour, whichever is easier to read on the given colour. */
export function readableOn(hex: string) {
  return contrast(hex, "#ffffff") >= contrast(hex, LABEL) ? "#ffffff" : LABEL;
}

/**
 * The colour for tinted text and links on a white card. A tint too pale to
 * read (below the WCAG AA ratio of 4.5:1) is swapped for the label colour.
 */
export function tintOnWhite(hex: string) {
  return contrast(hex, "#ffffff") >= 4.5 ? hex : LABEL;
}

/** Maps market colours to CSS variables with contrasting text colours. */
export function themeStyle(theme: MarketDTO["theme"]): CSSProperties {
  return {
    "--brand": theme.brand,
    "--on-brand": readableOn(theme.brand),
    "--tint-text": tintOnWhite(theme.brand),
    "--ground": theme.ground,
    "--on-ground": readableOn(theme.ground),
    "--accent": theme.accent,
    "--on-accent": readableOn(theme.accent),
  } as CSSProperties;
}
