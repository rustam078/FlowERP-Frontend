// Tiny color helpers for theming. All take/return #RRGGBB hex.

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

const parse = (hex) => {
  const h = (hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(full || '000000', 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const toHex = ({ r, g, b }) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;

// Darken a hex color by `amount` (0..1), e.g. darken('#2B3D62', 0.12).
export const darken = (hex, amount = 0.12) => {
  const { r, g, b } = parse(hex);
  const f = 1 - amount;
  return toHex({ r: r * f, g: g * f, b: b * f });
};

// Readable text color (white or near-black) for a given background.
export const readableText = (hex) => {
  const { r, g, b } = parse(hex);
  // Relative luminance (sRGB approximation).
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0F172A' : '#FFFFFF';
};

// A muted version of the text color (for inactive nav labels/icons).
export const mutedText = (hex) => (readableText(hex) === '#FFFFFF' ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.6)');
