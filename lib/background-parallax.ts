/**
 * Guardrail: keep this near ~160-220vw so Wonderland billboards stay visible.
 * Very high values (300vw+) over-zoom and hide left/right storytelling anchors.
 */
export const BG_PANORAMA_MIN_WIDTH_VW = 175;

/**
 * Passed to `useScrollDrivenShiftX`: shift = (0.5 − scrollProgress) * rangeVw
 * (page top → left of art, scroll down → pan toward the right).
 */
export const BG_SCROLL_SHIFT_RANGE_VW = BG_PANORAMA_MIN_WIDTH_VW - 100;
