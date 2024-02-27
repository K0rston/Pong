/**
 * @typedef {import("state").Ball} Ball
 * @typedef {import("state").Paddle} Paddle
 * @typedef {import("state").Score} Score
 * @typedef {import("state").State} State
 */

import {
  BALL_RADIUS,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  SCORE_MARGIN,
} from "./globals.js";

const BACKGROUND_COLOR = "lch(85% 50 260)";
const BALL_COLOR = "lch(85% 50 95)";
const PADDLE_COLOR = "lch(85% 50 0)";

const LINE_COLOR = "black";
const LINE_WIDTH = 2;

/**
 * Paint a background over previous frame.
 *
 * @param { CanvasRenderingContext2D } ctx
 * @returns { void }
 */
function clear(ctx) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fill();
}

/**
 * Draw a simple ball.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Ball} ball
 * @returns {void}
 */
function drawBall(ctx, ball) {
  ctx.beginPath();

  ctx.fillStyle = BALL_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = LINE_COLOR;

  ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, 2 * Math.PI);

  ctx.fill();
  ctx.stroke();
}

/**
 * Draw one paddle.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Paddle} paddle
 * @returns {void}
 */
function drawPaddle(ctx, paddle) {
  ctx.beginPath();

  ctx.fillStyle = PADDLE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = LINE_COLOR;

  // We draw it with x and y in its center.
  ctx.rect(
    paddle.pos.x - PADDLE_WIDTH / 2,
    paddle.pos.y - PADDLE_HEIGHT / 2,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  ctx.fill();
  ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Score} score
 * @returns {void}
 */
function drawScore(ctx, score) {
  const fontSize = Math.round(ctx.canvas.height / 4);
  const center = ctx.canvas.width / 2;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = "lch(100% none none / 0.3)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  ctx.fillText(`${score[0]}`, center, SCORE_MARGIN + fontSize + 20);
  ctx.fillText(`${score[1]}`, center, ctx.canvas.height - SCORE_MARGIN);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {State} state
 * @returns {void}
 */
export function render(ctx, state) {
  clear(ctx);
  drawScore(ctx, state.score);
  drawBall(ctx, state.ball);

  for (const paddle of state.paddles) {
    drawPaddle(ctx, paddle);
  }
}
