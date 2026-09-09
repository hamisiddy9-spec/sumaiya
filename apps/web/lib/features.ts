// Client-visible feature flags.
//
// Payments were removed (2026-09-08) — PayMe Africa never went live and the
// whole payment stack was retired. Every feature is free. This constant stays
// exported (many components branch on it) and pinned false, so the pricing /
// "view plans" / checkout UI stays hidden. When payments come back, wire a real
// flag here.
export const PAYMENTS_ENABLED = false;
