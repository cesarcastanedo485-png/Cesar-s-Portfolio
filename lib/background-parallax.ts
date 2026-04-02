/**
 * Desktop / large viewports: lower vw = more zoomed out (billboards stay readable).
 */
export const BG_PANORAMA_MIN_WIDTH_VW = 138;

/**
 * Mobile-first: lower vw = more zoomed out on phones so left/right billboard copy
 * can fit while scrolling (paired with MOBILE_ARP_SHIFT_*).
 */
export const BG_PANORAMA_MIN_WIDTH_VW_MOBILE = 92;

/**
 * Mobile scroll framing for alice-parallax: top = Mad Hatter (left billboard), bottom = right billboard.
 * Positive --arp-scroll-x reveals more of the left side; negative reveals more of the right.
 * Tune if the source art is re-cropped.
 */
export const MOBILE_ARP_SHIFT_START_VW = 108;
export const MOBILE_ARP_SHIFT_END_VW = -72;

/**
 * Passed to `useScrollDrivenShiftX`: shift = (0.5 − scrollProgress) * rangeVw
 * (page top → left of art, scroll down → pan toward the right).
 */
export const BG_SCROLL_SHIFT_RANGE_VW = BG_PANORAMA_MIN_WIDTH_VW - 100;

/** Floor so reduced-motion users still get a usable horizontal pan on phones. */
export const BG_SCROLL_SHIFT_RANGE_VW_MIN = 14;

export function panoramaScrollRangeVw(panoramaMinWidthVw: number): number {
  return Math.max(BG_SCROLL_SHIFT_RANGE_VW_MIN, panoramaMinWidthVw - 100);
}
