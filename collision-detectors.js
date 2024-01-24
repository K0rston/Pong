/**
 * @typedef {import("./state.js").State} State
 *
 * @typedef {object} BallPaddleCollision
 * @prop {"ball.paddle"} type
 * @prop {number} paddle
 *
 * @typedef {object} BallWallCollision
 * @prop {"ball.wall"} type
 * @prop {"left" | "right"} wall
 *
 * @typedef {object} BallGoalCollision
 * @prop {"ball.goal"} type
 * @prop {"top" | "bottom"} goal
 *
 * @typedef {BallPaddleCollision | BallWallCollision | BallGoalCollision} Collision
 * @typedef {Set<Collision>} Collisions
 */

import { BALL_RADIUS, PADDLE_HEIGHT, PADDLE_WIDTH } from "./globals.js";

/**
 * See if the ball is bounching off either of the walls.
 *
 * @param {State} state
 * @returns {BallWallCollision | null}
 */
function detectBallWallCollision({ ball, boundaries }) {
  if (ball.pos.x - BALL_RADIUS < boundaries.xMin) {
    return {
      type: "ball.wall",
      wall: "left",
    };
  }

  if (ball.pos.x + BALL_RADIUS > boundaries.xMax) {
    return {
      type: "ball.wall",
      wall: "right",
    };
  }

  // The ball did not collide with either of the walls.
  return null;
}

/**
 * See if the ball reaches either of the goals on the top or bottom
 * bounderies.
 *
 * @param {State} state
 * @returns {BallGoalCollision | null}
 */
function detectBallGoalCollision({ ball, boundaries }) {
  if (ball.pos.y - BALL_RADIUS < boundaries.yMin) {
    return {
      type: "ball.goal",
      goal: "top",
    };
  }

  if (ball.pos.y + BALL_RADIUS > boundaries.yMax) {
    return {
      type: "ball.goal",
      goal: "bottom",
    };
  }

  // The ball did not collide with either of the goals.
  return null;
}

/**
 * See if the ball is bouncing off either of the paddles.
 *
 * @param {State} state
 * @returns {BallPaddleCollision | null}
 */
function detectBallPaddleCollision({ ball, paddles }) {
  let i = 0;

  for (const paddle of paddles) {
    if (
      ball.pos.x > paddle.pos.x - PADDLE_WIDTH / 2 &&
      ball.pos.x < paddle.pos.x + PADDLE_WIDTH / 2 &&
      ball.pos.y > paddle.pos.y - PADDLE_HEIGHT / 2 &&
      ball.pos.y < paddle.pos.y + PADDLE_HEIGHT / 2
    ) {
      return {
        type: "ball.paddle",
        paddle: i,
      };
    }

    i += 1;
  }

  return null;
}

const COLLISION_DETECTORS = [
  detectBallWallCollision,
  detectBallGoalCollision,
  detectBallPaddleCollision,
];

/**
 * @param {State} state
 * @returns {Collisions}
 */
export function detectCollisions(state) {
  const collisions = new Set();

  for (const detector of COLLISION_DETECTORS) {
    const collision = detector(state);

    if (collision) {
      collisions.add(collision);
    }
  }

  return collisions;
}
