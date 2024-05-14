/**
 * @typedef {import("./collision-detectors.js").BallPaddleCollision} BallPaddleCollision
 * @typedef {import("./collision-detectors.js").BallBrickCollision} BallBrickCollision
 * @typedef {import("./collision-detectors.js").BallWallCollision} BallWallCollision
 * @typedef {import("./collision-detectors.js").PowerupPaddleCollision} PowerupPaddleCollsion
 * @typedef {import("./collision-detectors.js").Collisions} Collisions
 * @typedef {import("./state.js").State} State
 */

/**
 * Mutate the ball state such that the balls angle is adjusted to
 * reflect a bounce of the wall.
 *
 * @param {BallWallCollision} collision
 * @param {State} state
 * @param {State} oldState
 * @returns {void}
 */
function handleBallWallCollision({ wall }, state, { ball: oldBall }) {
  if (wall === "bottom") {
    state.isServing = true;
    return;
  }

  if (wall === "left" || wall === "right") {
    // The formula is: new angle = 2 * wall angle - current ball angle
    // Since the wall angle is π/2 radians (90°) this simplifies to π -
    // ball angle.
    const angle = Math.PI - oldBall.angle;

    state.ball.angle = angle;

    // Recalculate the new x position based in the new angle.
    state.ball.pos.x = oldBall.pos.x + oldBall.speed * Math.cos(angle);
  } else {
    const angle = -state.ball.angle;
    state.ball.angle = angle;
    state.ball.pos.y = oldBall.pos.y + oldBall.speed * Math.sin(angle);
  }
}

/**
 * Mutate the ball state such that the balls angle is adjusted to
 * reflect a bounce of the wall.
 *
 * @param {BallBrickCollision} collision
 * @param {State} state
 * @param {State} oldState
 * @returns {void}
 */
function handleBallBrickCollision(
  { brick: brickIndex, side },
  state,
  { ball: oldBall },
) {
  if (side === "left" || side === "right") {
    // The formula is: new angle = 2 * wall angle - current ball angle
    // Since the wall angle is π/2 radians (90°) this simplifies to π -
    // ball angle.
    const angle = Math.PI - oldBall.angle;

    state.ball.angle = angle;

    // Recalculate the new x position based in the new angle.
    state.ball.pos.x = oldBall.pos.x + oldBall.speed * Math.cos(angle);
  } else {
    const angle = -state.ball.angle;
    state.ball.angle = angle;
    state.ball.pos.y = oldBall.pos.y + oldBall.speed * Math.sin(angle);
  }

  const [brick] = state.bricks.splice(brickIndex, 1);

  // Powerups
  const { powerup } = brick;
  if (powerup) {
    state.powerups.push(powerup);
    powerup.pos = brick.pos;
  }
}

/**
 * Mutate the ball state such that the balls new angle is adjusted
 * according to how far from the center of the paddle it hit.
 *
 * @param {State} state
 * @param {State} oldState
 * @returns {void}
 */
function handleBallPaddleCollision(state, { ball: oldBall, paddle }) {
  // Calculate tilt such that if the ball lands closer to the edge of
  // the paddle, the more horizontal it will bounce off of it.
  const tilt =
    Math.PI * ((state.ball.pos.x - paddle.pos.x) / (paddle.width + 20));

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
 * @param {PowerupPaddleCollsion} collision
 * @param {State} state
 */
function handlePowerupPaddleCollision({ powerup }, state) {
  powerup.pos = null;
  powerup.active = true;

  if (powerup.type === "expander") {
    state.paddle.desiredWidth += 10;
  }
}

/**
 * @param {Collisions} collisions
 * @param {State} state
 * @param {State} oldState
 */
export function handleCollisions(collisions, state, oldState) {
  for (const collision of collisions) {
    switch (collision.type) {
      case "ball.brick": {
        handleBallBrickCollision(collision, state, oldState);
        break;
      }

      case "ball.wall": {
        handleBallWallCollision(collision, state, oldState);
        break;
      }

      case "ball.paddle": {
        handleBallPaddleCollision(state, oldState);
        break;
      }

      case "powerup.paddle": {
        handlePowerupPaddleCollision(collision, state);
      }
    }
  }
}
