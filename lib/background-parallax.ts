/**
 * Panorama background layer + scroll pan. Wider min-width = more horizontal canvas for
 * scroll, but object-cover scales to fill that box — too large reads as extreme zoom-in.
 * Tune here vs scroll range (stay roughly within minWidth − 100vw).
 */
export const BG_PANORAMA_MIN_WIDTH_VW = 420;

/**
 * Passed to `useScrollDrivenShiftX`: shift = (0.5 − scrollProgress) * rangeVw
 * (page top → left of art, scroll down → pan toward the right).
 */
export const BG_SCROLL_SHIFT_RANGE_VW = BG_PANORAMA_MIN_WIDTH_VW - 100;
