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
 *
 * @typedef {0 | 1 | null} ServingPaddle - Which paddle is serving the ball, if any
 * @typedef {[number, number]} Score - Keep track of the score
 *
 * @typedef {object} State
 * @prop {Boundaries} boundaries
 * @prop {Ball} ball
 * @prop {[Paddle, Paddle]} paddles
 * @prop {ServingPaddle} servingPaddle
 * @prop {Score} score
 */

import {
  BALL_RADIUS,
  BALL_SPEED,
  PADDLE_HEIGHT,
  PADDLE_OFFSET_Y,
  PADDLE_SPEED,
  PADDLE_WIDTH,
} from "./globals.js";

/**
 * The starting position / initial state of the game.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {State}
 */
export function createState(canvas) {
  return {
    // Start a fair game.
    score: [0, 0],

    // The edges of the playing board.
    boundaries: { xMin: 0, xMax: canvas.width, yMin: 0, yMax: canvas.height },

    ball: {
      pos: { x: canvas.width / 2, y: PADDLE_OFFSET_Y + PADDLE_HEIGHT / 2 },
      angle: Math.PI / 3,
      speed: 3,
    },

    // Two paddles, one at top, one at bottom.
    paddles: [
      {
        pos: { x: canvas.width / 2, y: PADDLE_OFFSET_Y },
      },
      {
        pos: { x: canvas.width / 2, y: canvas.height - PADDLE_OFFSET_Y },
      },
    ],

    // Top paddle starts,
    servingPaddle: 0,
  };
}

/**
 * Mutate the state of the paddles. The top paddle should move if the
 * `a` or `d` keys are pressed, similarly if the `←` or `→` (named
 * ArrowLeft and ArrowRight respectively) are pressed, the bottom
 * paddle should move.
 *
 * @param {State} state
 * @param {State} oldState
 * @param {Inputs} inputs
 */
function updatePaddles(state, { paddles, boundaries }, inputs) {
  const xMin = boundaries.xMin + PADDLE_WIDTH / 2;
  const xMax = boundaries.xMax - PADDLE_WIDTH / 2;

  if (inputs.has("a")) {
    state.paddles[0].pos.x = Math.max(xMin, paddles[0].pos.x - PADDLE_SPEED);
  }

  if (inputs.has("d")) {
    state.paddles[0].pos.x = Math.min(xMax, paddles[0].pos.x + PADDLE_SPEED);
  }

  if (inputs.has("ArrowLeft")) {
    state.paddles[1].pos.x = Math.max(xMin, paddles[1].pos.x - PADDLE_SPEED);
  }

  if (inputs.has("ArrowRight")) {
    state.paddles[1].pos.x = Math.min(xMax, paddles[1].pos.x + PADDLE_SPEED);
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
function updateServingPaddle(
  state,
  { servingPaddle: oldServingPaddle },
  inputs
) {
  if (oldServingPaddle !== null && inputs.has(" ")) {
    // A player pressed the space bar. Let’s release the ball.
    state.servingPaddle = null;
  }
}

/**
 * Mutate the ball state of the ball after calculated all collisions.
 *
 * @param {State} state - The current state
 * @param {State} oldState - The previous state
 */
function updateBall(state, { ball: oldBall, servingPaddle: oldServingPaddle }) {
  if (state.servingPaddle !== null) {
    // The ball is in the serve position, It is completely determined by the
    // position of the paddle.
    let y = state.paddles[state.servingPaddle].pos.y;

    // Compute the offset, i.e. how much the ball’s center is from the paddle’s
    // center while still colliding.
    const offset = PADDLE_HEIGHT / 2 + BALL_RADIUS + 1;

    // Push the ball to the top of the paddle.
    if (state.servingPaddle === 0) {
      // Top paddle, in this case it is at a higher y coordinate,
      // i.e. under it.
      y += offset;
    } else {
      // Bottom paddle, push it upwards, i.e. lower y coordinate.
      y -= offset;
    }

    state.ball.pos.x = state.paddles[state.servingPaddle].pos.x;
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

    if (oldServingPaddle === 0) {
      // Top paddle has it, shoot it downwards (π/2 radians = 90 deg).
      angle = Math.PI / 2;
    } else {
      // -π/2 radians = -90 deg is straight up.
      angle = -Math.PI / 2;
    }

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

  updateServingPaddle(state, oldState, inputs);
  updatePaddles(state, oldState, inputs);
  updateBall(state, oldState);

  return state;
}
