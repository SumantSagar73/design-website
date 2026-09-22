/* The glyph, in an 815 × 754 viewBox: a slanted block with rounded top-right
   and bottom-left corners, sliced by thin gaps that run parallel to its right
   edge (dx -110 per dy 460). Shared by GlyphArt and the games. */
export const GLYPH =
  'M 250 318 L 575 138 Q 612 118 604 160 L 500 570 Q 494 588 470 590 ' +
  'L 225 594 Q 190 594 196 560 L 232 345 Q 236 326 250 318 Z'

export const GLYPH_BOX = { x: 190, y: 118, w: 422, h: 476 }

/** Slope of the glyph's stripes: x shift per unit of y (negative = leans right going up). */
export const GLYPH_SLANT = -110 / 460
