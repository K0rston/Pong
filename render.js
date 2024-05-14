/**
 * @typedef {import("state").Ball} Ball
 * @typedef {import("state").Paddle} Paddle
 * @typedef {import("state").Powerup} Powerup
 * @typedef {import("state").Brick} Brick
 * @typedef {import("state").Score} Score
 * @typedef {import("state").State} State
 */

import {
  BALL_RADIUS,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  PADDLE_HEIGHT,
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
 * Draw a powerup.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("state").Powerup} powerup
 * @returns {void}
 */
function drawPowerup(ctx, powerup) {
  if (!powerup.pos) {
    return;
  }

  ctx.beginPath();

  ctx.fillStyle = "white";
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = LINE_COLOR;

  ctx.arc(powerup.pos.x, powerup.pos.y, 2, 0, 2 * Math.PI);

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
    paddle.pos.x - paddle.width / 2,
    paddle.pos.y - PADDLE_HEIGHT / 2,
    paddle.width,
    PADDLE_HEIGHT,
  );

  ctx.fill();
  ctx.stroke();
}

/**
 * Draw one brick.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Brick} brick
 * @returns {void}
 */
function drawBrick(ctx, brick) {
  ctx.beginPath();

  if (brick.powerup) {
    ctx.fillStyle = "red";
  } else {
    ctx.fillStyle = "white";
  }

  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = LINE_COLOR;

  ctx.rect(
    brick.pos.x - BRICK_WIDTH / 2,
    brick.pos.y - BRICK_HEIGHT / 2,
    BRICK_WIDTH,
    BRICK_HEIGHT,
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
  drawPaddle(ctx, state.paddle);

  for (const brick of state.bricks) {
    drawBrick(ctx, brick);
  }

  for (const powerup of state.powerups) {
    drawPowerup(ctx, powerup);
  }
}
