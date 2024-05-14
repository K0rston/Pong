/**
 * @typedef {import("inputs").Inputs} Inputs
 * @typedef {import("collision-detectors").Collision} Collision
 *
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
 * @prop {number} width - The width of the paddle.
 * @prop {number} desiredWidth - What the paddle width will become after animation.
 *
 * @typedef {object} Brick
 * @prop {Pos} pos - The position of the brick in x, y coordinates.
 * @prop {Powerup | null} powerup
 *
 * @typedef {object} Powerup
 * @prop {"expander"} type
 * @prop {boolean} active
 * @prop {Pos | null} pos
 * @prop {number} timer
 *
 * @typedef {[number, number]} Score - Keep track of the score
 *
 * @typedef {object} State
 * @prop {boolean} isPaused
 * @prop {boolean} isServing
 * @prop {Boundaries} boundaries
 * @prop {Ball} ball
 * @prop {Paddle} paddle
 * @prop {Brick[]} bricks
 * @prop {Score} score
 * @prop {Powerup[]} powerups
 */

import { randomPowerup } from "./gameplay.js";
import {
  BALL_RADIUS,
  BALL_SPEED,
  BRICK_COLS,
  BRICK_HEIGHT,
  BRICK_ROWS,
  BRICK_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_OFFSET_Y,
  PADDLE_SPEED,
  PADDLE_WIDTH,
  POWERUP_DROP_SPEED,
} from "./globals.js";

/**
 * The starting position / initial state of the game.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {State}
 */
export function createState(canvas) {
  /** @type {Brick[]} */
  const bricks = [];

  for (let row = 0; row < BRICK_ROWS; row += 1) {
    const y = 40 + row * (BRICK_HEIGHT + 10);

    for (let col = 0; col < BRICK_COLS; col += 1) {
      const x = 40 + col * (BRICK_WIDTH + 10);
      bricks.push({ pos: { x, y }, powerup: randomPowerup() });
    }
  }

  return {
    isPaused: false,

    // Is the ball stuck to the paddle?
    isServing: true,

    // Start a fair game.
    score: [0, 0],

    // The edges of the playing board.
    boundaries: { xMin: 0, xMax: canvas.width, yMin: 0, yMax: canvas.height },

    ball: {
      pos: { x: canvas.width / 2, y: PADDLE_OFFSET_Y + PADDLE_HEIGHT / 2 },
      angle: Math.PI / 3,
      speed: 3,
    },

    paddle: {
      pos: { x: canvas.width / 2, y: canvas.height - PADDLE_OFFSET_Y },
      width: PADDLE_WIDTH,
      desiredWidth: PADDLE_WIDTH,
    },

    bricks,

    powerups: [],
  };
}

/**
 * Mutate the state to enter or leave the pause state.
 *
 * @param {State} state
 * @param {Inputs} inputs
 */
function updatePause(state, inputs) {
  if (inputs.has("p")) {
    // Toggle the pause state.
    state.isPaused = !state.isPaused;

    // Drop the key from the inputs to prevent reverting next frame
    // when key is held.
    inputs.delete("p");
  }
}

/**
 * Mutate the state of the paddle. The top paddle should move if the
 * `←` or `→` (named ArrowLeft and ArrowRight respectively) are
 * pressed, the bottom paddle should move.
 *
 * @param {State} state
 * @param {State} oldState
 * @param {Inputs} inputs
 */
function updatePaddle(state, { paddle, boundaries }, inputs) {
  const xMin = boundaries.xMin + paddle.width / 2;
  const xMax = boundaries.xMax - paddle.width / 2;

  if (inputs.has("ArrowLeft")) {
    state.paddle.pos.x = Math.max(xMin, paddle.pos.x - PADDLE_SPEED);
  }

  if (inputs.has("ArrowRight")) {
    state.paddle.pos.x = Math.min(xMax, paddle.pos.x + PADDLE_SPEED);
  }

  if (state.paddle.width < state.paddle.desiredWidth) {
    state.paddle.width = Math.min(
      state.paddle.desiredWidth,
      state.paddle.width + 1,
    );
  } else if (state.paddle.width > state.paddle.desiredWidth) {
    state.paddle.width = Math.max(
      state.paddle.desiredWidth,
      state.paddle.width - 1,
    );
  }
}

/**
 * @param {State} state
 */
function updatePowerups(state) {
  for (const powerup of state.powerups) {
    if (powerup.pos) {
      powerup.pos.y += POWERUP_DROP_SPEED;
      continue;
    }

    powerup.timer -= 1;

    if (powerup.timer <= 0) {
      if (powerup.type === "expander") {
        state.paddle.desiredWidth -= 10;
      }

      const index = state.powerups.indexOf(powerup);
      state.powerups.splice(index, 1);
    }
  }
}

/**
 * If the space bar is pressed (`input.has(" ")`) the ball should be
 * served (released) by whichever paddle is serving. But otherwise
 * everything is left unchanged.
 *
 * @param {State} state
 * @param {State} oldState
 * @param {Inputs} inputs
 */
function updateServingPaddle(state, { isServing: wasServing }, inputs) {
  if (wasServing && inputs.has(" ")) {
    // A player pressed the space bar. Let’s release the ball.
    state.isServing = false;
  }
}

/**
 * Mutate the ball state of the ball after calculated all collisions.
 *
 * @param {State} state - The current state
 * @param {State} oldState - The previous state
 */
function updateBall(state, { ball: oldBall, isServing: wasServing }) {
  if (state.isServing) {
    // The ball is in the serve position, It is completely determined by the
    // position of the paddle.
    let y = state.paddle.pos.y;

    // Compute the offset, i.e. how much the ball’s center is from the paddle’s
    // center while still colliding.
    const offset = PADDLE_HEIGHT / 2 + BALL_RADIUS + 1;

    // Bottom paddle, push it upwards, i.e. lower y coordinate.
    y -= offset;

    state.ball.pos.x = state.paddle.pos.x;
    state.ball.pos.y = y;
    state.ball.angle = 0;
    state.ball.speed = 0;

    // We don’t need to see anything else. We can safely return from this
    // function.
    return;
  }

  let { angle, speed } = oldBall;
  if (speed === 0) {
    // The ball is not moving, it must have been served in this frame.
    speed = BALL_SPEED;

    // -π/2 radians = -90 deg is straight up.
    angle = -Math.PI / 2;

    state.ball.angle = angle;
    state.ball.speed = speed;
  }

  // sin and cos are built in trigonomic functions. You’ll learn about
  // trig functions in an advanced math class. They are super useful
  // for drawing.  Basically cos(angle) is how much your x coordinate,
  // changes and sin(angle) is how much your y coordinate
  // changes. Multiply by speed.
  state.ball.pos.x = oldBall.pos.x + speed * Math.cos(angle);
  state.ball.pos.y = oldBall.pos.y + speed * Math.sin(angle);
}

/**
 * Update the state of the game. Recalculate all the positions, all momentum,
 * react to interactions, collisions, and user inputs.
 *
 * @param {State} oldState
 * @param {Inputs} inputs
 * @returns {State}
 */
export function updateState(oldState, inputs) {
  // Keep a record of our previous state.
  const state = structuredClone(oldState);

  updatePause(state, inputs);

  if (!state.isPaused) {
    updateServingPaddle(state, oldState, inputs);
    updatePowerups(state);
    updatePaddle(state, oldState, inputs);
    updateBall(state, oldState);
  }

  return state;
}
