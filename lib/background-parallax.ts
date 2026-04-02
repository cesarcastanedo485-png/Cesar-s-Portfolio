/**
 * Desktop / large viewports: lower vw = more zoomed out (billboards stay readable).
 */
export const BG_PANORAMA_MIN_WIDTH_VW = 132;

/**
 * Mobile-first: lower vw = more zoomed out on phones so left/right billboard copy
 * can fit while scrolling (paired with MOBILE_ARP_SHIFT_*).
 */
export const BG_PANORAMA_MIN_WIDTH_VW_MOBILE = 156;

/**
 * Mobile scroll framing for alice-parallax, left-anchored and horizontal-only.
 * Start on left billboard and sweep to right billboard.
 */
export const MOBILE_ARP_SHIFT_START_VW = 0;
export const MOBILE_ARP_SHIFT_END_VW = -(BG_PANORAMA_MIN_WIDTH_VW_MOBILE - 100);
export const MOBILE_ARP_SHIFT_START_VH = 0;
export const MOBILE_ARP_SHIFT_END_VH = 0;

/**
 * Desktop sweep from top-left anchor.
 * Start = 0, end = -(panoramaMinWidthVw - 100), so camera pans to the right as you scroll.
 */
export const BG_SCROLL_SHIFT_RANGE_VW = BG_PANORAMA_MIN_WIDTH_VW - 100;
export const BG_SCROLL_SHIFT_RANGE_VH = 0;

/** Floor so reduced-motion users still get a usable horizontal pan on phones. */
export const BG_SCROLL_SHIFT_RANGE_VW_MIN = 14;
export const BG_SCROLL_SHIFT_RANGE_VH_MIN = 0;

export function panoramaScrollRangeVw(panoramaMinWidthVw: number): number {
  return Math.max(BG_SCROLL_SHIFT_RANGE_VW_MIN, panoramaMinWidthVw - 100);
}

export function panoramaScrollRangeVh(rangeVh: number): number {
  return Math.max(BG_SCROLL_SHIFT_RANGE_VH_MIN, rangeVh);
}
