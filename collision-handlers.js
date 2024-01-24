/**
 * @typedef {import("./collision-detectors.js").BallGoalCollision} BallGoalCollision
 * @typedef {import("./collision-detectors.js").BallPaddleCollision} BallPaddleCollision
 * @typedef {import("./collision-detectors.js").Collisions} Collisions
 * @typedef {import("./state.js").State} State
 */

import { PADDLE_WIDTH } from "./globals.js";

/**
 * Mutate the ball state such that the balls angle is adjusted to
 * reflect a bounce of the wall.
 *
 * @param {State} state
 * @param {State} oldState
 * @returns {void}
 */
function handleBallWallCollision(state, { ball: oldBall }) {
  // The formula is: new angle = 2 * wall angle - current ball angle
  // Since the wall angle is π/2 radians (90°) this simplifies to π -
  // ball angle.
  const angle = Math.PI - oldBall.angle;

  state.ball.angle = angle;

  // Recalculate the new x position based in the new angle.
  state.ball.pos.x = oldBall.pos.x + oldBall.speed * Math.cos(angle);
}

/**
 * Mutate the ball state such that the balls new angle is adjusted
 * according to how far from the center of the paddle it hit.
 *
 * @param {BallPaddleCollision} collision
 * @param {State} state
 * @param {State} oldState
 * @returns {void}
 */
function handleBallPaddleCollision(collision, state, { ball: oldBall }) {
  const paddle = state.paddles[collision.paddle];

  // Calculate tilt such that if the ball lands closer to the edge of
  // the paddle, the more horizontal it will bounce off of it.
  const tilt =
    Math.PI * ((state.ball.pos.x - paddle.pos.x) / (PADDLE_WIDTH + 20));

  let angle;
  if (Math.asin(Math.sin(oldBall.angle)) > 0) {
    angle = -Math.PI / 2 + tilt;
  } else {
    angle = Math.PI / 2 - tilt;
  }

  state.ball.angle = angle;
  state.ball.pos.y = oldBall.pos.y + oldBall.speed * Math.sin(angle);
}

/**
 * Increment the points for the player that scored and put the ball
 * into a serving position of the other player.
 *
 * @param {BallGoalCollision} collision
 * @param {State} state
 * @returns {void}
 */
function handleBallGoalCollision({ goal }, state) {
  // See if we hit the top goal.
  if (goal === "top") {
    // Player 2 gets a point.
    state.score[1] += 1;

    // The ball resets to Player 1 paddle
    state.servingPaddle = 0;
  } else {
    // goal === "bottom"
    // Player 1 gets a point.
    state.score[0] += 1;

    // The ball resets to Player 2 paddle
    state.servingPaddle = 1;
  }
}

/**
 * @param {Collisions} collisions
 * @param {State} state
 * @param {State} oldState
 */
export function handleCollisions(collisions, state, oldState) {
  for (const collision of collisions) {
    if (collision.type === "ball.goal") {
      handleBallGoalCollision(collision, state);
    } else if (collision.type === "ball.paddle") {
      handleBallPaddleCollision(collision, state, oldState);
    } else {
      handleBallWallCollision(state, oldState);
    }
  }
}
