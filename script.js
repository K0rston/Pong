async function main() {
  const canvas = document.getElementById("game");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");

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

document.addEventListener("DOMContentLoaded", main);
