/**
 * Panorama background layer + scroll pan. Intentionally extreme so scroll can reach
 * far left/right of the art; tighten later once the framing feels right.
 */
export const BG_PANORAMA_MIN_WIDTH_VW = 3000;

/**
 * Passed to `useScrollDrivenShiftX`: shift = (scrollProgress - 0.5) * rangeVw.
 * Needs ~≤ minWidthVw − 100vw so ±half-range does not outrun the bitmap.
 */
export const BG_SCROLL_SHIFT_RANGE_VW = BG_PANORAMA_MIN_WIDTH_VW - 100;
