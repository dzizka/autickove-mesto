// Side stats on parts (DESIGN-v2 §4.3): which stats can appear as side stats,
// and how a part's stat budget is split between the main stat and side stats.

/** Share of the budget that goes to the main stat, by number of side stats. */
export const MAIN_SHARE = [1, 0.75, 0.62, 0.52];

/** Weights of side stats; any stat except the part's own main stat can appear. */
export const SIDE_STAT_WEIGHTS = {
  speed: 3,
  handling: 3,
  armor: 3,
  fuel: 2,
  magnet: 2,
  luck: 2,
};
