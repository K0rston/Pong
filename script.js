/**
 * @typedef {{ x: number, y: number }} Pos - Position in x, y coordinates.
 *
 * @typedef {object} Boundaries - The wall, bounding box of the game.
 * @prop {number} xMin - The left wall.
 * @prop {number} xMax - The right wall.
 * @prop {number} yMin - The top wall, goal of player 1.
 * @prop {number} yMax - The bottom wall, goal of player 2.
 *
 * @typedef {object} Ball
 * @prop {Pos} pos - The position of the ball in x, y coordinates.
 * @prop {number} speed - The speed of the ball in pixles per frame. 0 is stopped.
 * @prop {number} angle - The angle of the ball’s movement in radiants. 0 is to the right, π/2 = 90 deg is down.
 *
 * @typedef {object} Paddle
 * @prop {Pos} pos - The x, y coordinate of the paddle.
 *
 * @typedef {object} State
 * @prop {Boundaries} boundaries
 * @prop {Ball} ball
 * @prop {[Paddle, Paddle]} paddles
 */

const BALL_RADIUS = 7.5;
const BALL_SPEED = 3;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 2;

// How far from the edge the paddle is positioned.
const PADDLE_OFFSET_Y = 20;

/**
 * Iterate over all the animation frame, yielding ones per frame.
 *
 * @returns {Generator<number>}
 */
async function* animationFrames() {
  while (true) {
    // Yield before screen is ready to draw another frame.
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    yield await new Promise(requestAnimationFrame);
  }
}

/**
 * The starting position / initial state of the game.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {State}
 */
function createState(canvas) {
  return {
    boundaries: { xMin: 0, xMax: canvas.width, yMin: 0, yMax: canvas.height },

    ball: {
      pos: { x: canvas.width / 2, y: canvas.height / 2 },
      angle: Math.PI / 3,
      speed: 3,
    },

    paddles: [
      {
        pos: { x: canvas.width / 2, y: PADDLE_OFFSET_Y },
      },
      {
        pos: { x: canvas.width / 2, y: canvas.height - PADDLE_OFFSET_Y },
      },
    ],
  };
}

/**
 * Return the new state of the ball after calculated all collisions.
 *
 * @param {State} state - The current state
 * @returns {Ball} - The new state of the ball
 */
function updateBall(state) {
  // sin and cos are built in trigonomic functions. You’ll learn about trig
  // functions in an advanced math class. They are super useful for drawing.
  // Basically cos(angle) is how much your x coordinate, changes and sin(angle)
  // is how much your y coordinate changes. Multiply by speed.

  // Make a copy of the old ball state to keep our record straight.
  const oldBall = structuredClone(state.ball);

  // Our new position. This will be updated as needed.
  const pos = {
    x: oldBall.pos.x + oldBall.speed * Math.cos(oldBall.angle),
    y: oldBall.pos.y + oldBall.speed * Math.sin(oldBall.angle),
  };

  // The new momentum.
  let angle = oldBall.angle;
  let speed = oldBall.speed;

  // See if we hit the top or bottom.
  // NOTE: This will be removed and replaced with a scoring system
  if (
    oldBall.pos.y < state.boundaries.yMin ||
    oldBall.pos.y > state.boundaries.yMax
  ) {
    angle = -oldBall.angle;
    pos.x = oldBall.pos.x + speed * Math.cos(angle);
    pos.y = oldBall.pos.y + speed * Math.sin(angle);

    return { pos, angle, speed };
  }

  // See if we hit the paddles.
  for (const paddle of state.paddles) {
    if (
      pos.x > paddle.pos.x - PADDLE_WIDTH / 2 &&
      pos.x < paddle.pos.x + PADDLE_WIDTH / 2 &&
      pos.y > paddle.pos.y - PADDLE_HEIGHT / 2 &&
      pos.y < paddle.pos.y + PADDLE_HEIGHT / 2
    ) {
      // We hit a paddle.

      // Calculate tilt such that if the ball lands closer to the edge
      // of the paddle, the more horizontal it will bounce off of it.
      const tilt = Math.PI * ((pos.x - paddle.pos.x) / (PADDLE_WIDTH + 20));

      if (Math.asin(Math.sin(angle)) > 0) {
        angle = -Math.PI / 2 + tilt;
      } else {
        angle = Math.PI / 2 - tilt;
      }

      pos.y = oldBall.pos.y + speed * Math.sin(angle);

      // We’ve done everything we need. Return the new state.
      return { pos, angle, speed };
    }
  }

  // We didn’t hit a paddle. See if we hit left or right walls.
  if (
    pos.x - BALL_RADIUS < state.boundaries.xMin ||
    pos.x + BALL_RADIUS > state.boundaries.xMax
  ) {
    // The formula is: new angle = 2 * wall angle - current ball angle
    // Since the wall angle is π/2 radians (90°) this simplifies to
    // π - ball angle.
    angle = Math.PI - angle;

    // Recalculate the position based on the new angle.
    pos.x = oldBall.pos.x + speed * Math.cos(angle);
    pos.y = oldBall.pos.y + speed * Math.sin(angle);

    return { pos, angle, speed };
  }

  // No collision. Let the ball keep on rolling.
  return { pos, angle, speed };
}

/**
 * Update the state of the game. Recalculate all the positions, all momentum,
 * react to interactions, collisions, and user inputs.
 *
 * @param {State} state
 * @returns {void}
 */
function updateState(state) {
  state.ball = updateBall(state);
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
  ctx.fillStyle = "black";

  ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, 2 * Math.PI);

  ctx.fill();
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
  ctx.fillStyle = "black";

  // We draw it with x and y in its center.
  ctx.rect(
    paddle.pos.x - PADDLE_WIDTH / 2,
    paddle.pos.y - PADDLE_HEIGHT / 2,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  ctx.fill();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number}} ball
 * @returns {void}
 */
function render(ctx, state) {
  // Clear the canvas with a white background
  ctx.fillStyle = "white";
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fill();

  drawBall(ctx, state.ball);

  for (const paddle of state.paddles) {
    drawPaddle(ctx, paddle);
  }
}

async function main() {
  const canvas = document.getElementById("game");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const state = createState(canvas);

  for await (const _frame of animationFrames()) {
    updateState(state);
    render(ctx, state);
  }
}

document.addEventListener("DOMContentLoaded", main);
