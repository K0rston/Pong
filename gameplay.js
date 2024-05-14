/**
 * @typedef {import("./state.js").Powerup} Powerup
 */

/**
 * @returns {Powerup | null}
 */
export function randomPowerup() {
  const p = Math.random();

  if (p > 0.1875) {
    return null;
  }

  return { type: "expander", active: false, pos: null, timer: 30 * 60 };
}
