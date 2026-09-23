/* The MyOrbit mark, in an 815 × 754 viewBox: the navbar's orbit ring — a
   circle broken by one gap, with rounded caps — scaled into the coordinate
   space the games and GlyphArt already draw in.

   Geometry matches src/components/Navbar.tsx exactly: centreline radius 200,
   stroke 46.6 (the navbar's 2.8 on r 12), a 33.4° gap, rotated -64°. */
export const GLYPH =
  'M 593.25 242.41 A 223.30 223.30 0 1 1 498.89 155.30 ' +
  'A 23.30 23.30 0 0 1 478.46 197.18 ' +
  'A 176.70 176.70 0 1 0 553.13 266.11 ' +
  'A 23.30 23.30 0 0 1 593.25 242.41 Z'

export const GLYPH_BOX = { x: 178, y: 133, w: 447, h: 447 }

/** Centre of the ring's opening, in radians — the axis a clean cut runs along. */
export const GLYPH_GAP_AXIS = (-47.29 * Math.PI) / 180

/** Decorative diagonal lean, used for the arcade's brick rake. */
export const GLYPH_SLANT = -110 / 460
