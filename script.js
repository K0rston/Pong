/**
 * @returns {Generator<number>}
 */
async function* animationFrames() {
  let i = 0;
  while (true) {
    yield await new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve(i);
        i += 1;
      });
    });
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @returns {void}
 */
function draw(ctx) {
  // Clear the canvas with a white background
  ctx.fillStyle = "white";
  ctx.rect(0, 0, 500, 500);
  ctx.fill();

  // Ball
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.arc(250, 250, 7.5, 0, 2 * Math.PI);
  ctx.fill();

  // Paddle 1
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.rect(100, 20, 80, 15);
  ctx.fill();

  // Paddle 2
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.rect(320, 465, 80, 15);
  ctx.fill();
}

async function main() {
  const canvas = document.getElementById("game");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");

  for await (const frame of animationFrames()) {
    draw(ctx);
  }
}

document.addEventListener("DOMContentLoaded", main);
