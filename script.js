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
 * @param {{x: number, y: number}} ball
 * @returns {void}
 */
function draw(ctx, ball) {
  // Clear the canvas with a white background
  ctx.fillStyle = "white";
  ctx.rect(0, 0, 500, 500);
  ctx.fill();

  // Ball
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.arc(ball.x, ball.y, 7.5, 0, 2 * Math.PI);
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

  // Create an object to hold the x and y coordinates of the ball.
  const ball = {
    x: 250,
    y: 250,
  };

  for await (const frame of animationFrames()) {
    // Draw the ball with the canvas context.
    draw(ctx, ball);

    // Move the ball down one pixel
    ball.y += 1;

    // Exit the loop after 200 frames
    if (frame >= 200) {
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", main);
