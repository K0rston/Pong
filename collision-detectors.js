/**
 * @typedef {import("./state.js").State} State
 * @typedef {import("./state.js").Powerup} Powerup
 *
 * @typedef {object} BallPaddleCollision
 * @prop {"ball.paddle"} type
 *
 * @typedef {object} BallWallCollision
 * @prop {"ball.wall"} type
 * @prop {"top" | "left" | "right" | "bottom"} wall
 *
 * @typedef {object} PowerupPaddleCollision
 * @prop {"powerup.paddle"} type
 * @prop {Powerup} powerup
 *
 * @typedef {object} PowerupWallCollision
 * @prop {"powerup.wall"} type
 *
 * @typedef {object} BallBrickCollision
 * @prop {"ball.brick"} type
 * @prop {number} brick
 * @prop {"top" | "left" | "right" | "bottom"} side
 *
 * @typedef {BallPaddleCollision | BallWallCollision | BallBrickCollision | PowerupPaddleCollision | PowerupWallCollision} Collision
 * @typedef {Set<Collision>} Collisions
 * @typedef {(collisions: Collisions, state: State, oldState: State) => void} CollisionDetector
 */

import {
  BALL_RADIUS,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  PADDLE_HEIGHT,
} from "./globals.js";

/**
 * See if the ball is bounching off either of the walls.
 *
 * @type {CollisionDetector}
 */
function detectBallWallCollision(collisions, { ball, boundaries }) {
  if (ball.pos.x - BALL_RADIUS < boundaries.xMin) {
    collisions.add({
      type: "ball.wall",
      wall: "left",
    });
  }

  if (ball.pos.x + BALL_RADIUS > boundaries.xMax) {
    collisions.add({
      type: "ball.wall",
      wall: "right",
    });
  }

  if (ball.pos.y + BALL_RADIUS < boundaries.yMin) {
    collisions.add({
      type: "ball.wall",
      wall: "top",
    });
  }

  if (ball.pos.y - BALL_RADIUS > boundaries.yMax) {
    collisions.add({
      type: "ball.wall",
      wall: "bottom",
    });
  }
}

/**
 * See if the ball is hitting any of our bricks.
 *
 * @type {CollisionDetector}
 */
function detectBallBrickCollision(
  collisions,
  { ball, bricks },
  { ball: oldBall },
) {
  let index = 0;

  for (const brick of bricks) {
    const ballTop = ball.pos.y - BALL_RADIUS;
    const ballBottom = ball.pos.y + BALL_RADIUS;
    const ballLeft = ball.pos.x - BALL_RADIUS;
    const ballRight = ball.pos.x + BALL_RADIUS;

    const brickTop = brick.pos.y - BRICK_HEIGHT / 2;
    const brickBottom = brick.pos.y + BRICK_HEIGHT / 2;
    const brickLeft = brick.pos.x - BRICK_WIDTH / 2;
    const brickRight = brick.pos.x + BRICK_WIDTH / 2;

    if (
      ballRight > brickLeft &&
      ballLeft < brickRight &&
      ballBottom > brickTop &&
      ballTop < brickBottom
    ) {
      /** @type {"top" | "bottom" | "left" | "right"} */
      let side;
      if (oldBall.pos.y - BALL_RADIUS >= brickBottom) {
        side = "bottom";
      } else if (oldBall.pos.y + BALL_RADIUS <= brickTop) {
        side = "top";
      } else if (oldBall.pos.x - BALL_RADIUS >= brickRight) {
        side = "right";
      } else {
        side = "left";
      }

      collisions.add({
        type: "ball.brick",
        brick: index,
        side,
      });
    }

    index += 1;
  }
}

/**
 * See if the ball is bouncing off either of the paddles.
 *
 * @type {CollisionDetector}
 */
function detectBallPaddleCollision(collisions, { ball, paddle }) {
  if (
    ball.pos.x > paddle.pos.x - paddle.width / 2 &&
    ball.pos.x < paddle.pos.x + paddle.width / 2 &&
    ball.pos.y > paddle.pos.y - PADDLE_HEIGHT / 2 &&
    ball.pos.y < paddle.pos.y + PADDLE_HEIGHT / 2
  ) {
    collisions.add({
      type: "ball.paddle",
    });
  }
}

/**
 * See if the ball is bouncing off either of the paddles.
 *
 * @type {CollisionDetector}
 */
function detectPowerupPaddleCollision(collisions, { powerups, paddle }) {
  for (const powerup of powerups) {
    if (!powerup.pos) {
      continue;
    }

    if (
      powerup.pos.x > paddle.pos.x - paddle.width / 2 &&
      powerup.pos.x < paddle.pos.x + paddle.width / 2 &&
      powerup.pos.y > paddle.pos.y - PADDLE_HEIGHT / 2 &&
      powerup.pos.y < paddle.pos.y + PADDLE_HEIGHT / 2
    ) {
      collisions.add({
        type: "powerup.paddle",
        powerup,
      });
    }
  }
}

const COLLISION_DETECTORS = [
  detectBallWallCollision,
  detectBallBrickCollision,
  detectBallPaddleCollision,
  detectPowerupPaddleCollision,
];

/**
 * @param {State} state
 * @param {State} oldState
 * @returns {Collisions}
 */
export function detectCollisions(state, oldState) {
  const collisions = new Set();

  for (const detector of COLLISION_DETECTORS) {
    detector(collisions, state, oldState);
  }

  return collisions;
}
