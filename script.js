import { detectCollisions } from "./collision-detectors.js";
import { handleCollisions } from "./collision-handlers.js";
import { createInputCollector } from "./inputs.js";
import { render } from "./render.js";
import { playSounds, prepareSound } from "./sound.js";
import { createState, updateState } from "./state.js";

/**
 * Iterate over all the animation frame, yielding ones per frame.
 *
 * @returns {AsyncGenerator<number>}
 */
async function* animationFrames() {
  while (true) {
    // Yield before screen is ready to draw another frame.
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    yield await new Promise(requestAnimationFrame);
  }
}

async function main() {
  const canvas = document.getElementById("game");
  prepareSound();

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!(ctx instanceof CanvasRenderingContext2D)) {
    return;
  }

  const inputs = createInputCollector();
  let oldState = createState(canvas);

  for await (const _frame of animationFrames()) {
    const state = updateState(oldState, inputs);

    // See if we have any collisions.
    const collisions = detectCollisions(state);
    handleCollisions(collisions, state, oldState);

    playSounds(collisions, state, oldState);
    render(ctx, state);

    // Sync the old state for next iteration.
    oldState = state;
  }
}

document.addEventListener("DOMContentLoaded", main);
