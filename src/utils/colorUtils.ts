/**
 * Converts a hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace("#", "");

  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Converts RGB components to a hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Lightens a color by a given percentage (0-100)
 */
export function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);

  // Calculate lightened values
  const newR = r + (255 - r) * (percent / 100);
  const newG = g + (255 - g) * (percent / 100);
  const newB = b + (255 - b) * (percent / 100);

  return rgbToHex(newR, newG, newB);
}

/**
 * Darkens a color by a given percentage (0-100)
 */
export function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);

  // Calculate darkened values
  const newR = r * (1 - percent / 100);
  const newG = g * (1 - percent / 100);
  const newB = b * (1 - percent / 100);

  return rgbToHex(newR, newG, newB);
}

// utils/colorUtils.ts

/**
 * Converts hex to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);

  // Normalize r, g, b to 0-1
  const [rNorm, gNorm, bNorm] = [r, g, b].map((c) => c / 255);

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);

  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex(r * 255, g * 255, b * 255);
}

// /**
//  * Lightens a color by adjusting HSL lightness
//  */
// export function lightenColor(hex: string, percent: number): string {
//   const { h, s, l } = hexToHsl(hex);
//   const newLightness = Math.min(100, l + percent);
//   return hslToHex(h, s, newLightness);
// }

// /**
//  * Darkens a color by adjusting HSL lightness
//  */
// export function darkenColor(hex: string, percent: number): string {
//   const { h, s, l } = hexToHsl(hex);
//   const newLightness = Math.max(0, l - percent);
//   return hslToHex(h, s, newLightness);
// }
