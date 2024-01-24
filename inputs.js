/**
 * @typedef { Set<string> } Inputs - The set of keyboard keys which are in the pressed down position at any given moment.
 */

// Every allowed user input.
const ALLOWED_INPUTS = [" ", "a", "d", "ArrowLeft", "ArrowRight"];

/**
 * @returns {Inputs}
 */
export function createInputCollector() {
  const inputs = new Set();

  window.addEventListener("keydown", (event) => {
    if (ALLOWED_INPUTS.includes(event.key)) {
      event.preventDefault();
      inputs.add(event.key);
    }
  });

  window.addEventListener("keyup", (event) => {
    inputs.delete(event.key);
  });

  return inputs;
}
