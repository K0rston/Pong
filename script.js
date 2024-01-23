/**
 * @typedef { Set<string> } Inputs - The set of keyboard keys which are in the pressed down position at any given moment.
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

const BALL_RADIUS = 7.5;
const BALL_SPEED = 3;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 2;

// How far from the edge the paddle is positioned.
const PADDLE_OFFSET_Y = 20;

// Lets put the score a little above the paddle.
const SCORE_MARGIN = PADDLE_OFFSET_Y + PADDLE_HEIGHT + 20;

const ALLOWED_INPUTS = [" ", "a", "d", "ArrowLeft", "ArrowRight"];

/**
 * @returns {Inputs}
 */
function createInputCollector() {
  const inputs = new Set();

  window.addEventListener("keydown", (event) => {
    if (ALLOWED_INPUTS.includes(event.key)) {
      event.preventDefault();
      inputs.add(event.key);
    }
  });

  window.addEventListener("keyup", (event) => {
    inputs.delete(event.key);
  });

  return inputs;
}

/**
 * Iterate over all the animation frame, yielding ones per frame.
 *
 * @returns {AsyncGenerator<number>}
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
 * Update the state of the paddles. The top paddle should move if the `a` or
 * `d` keys are pressed, similarly if the `←` or `→` (named ArrowLeft and
 * ArrowRight respectively) are pressed, the bottom paddle should move.
 *
 * @param { State } oldState
 * @param { Inputs } inputs
 * @returns { [Paddle, Paddle] }
 */
function updatePaddles({ paddles: oldPaddles, boundaries }, inputs) {
  const paddles = structuredClone(oldPaddles);

  const xMin = boundaries.xMin + PADDLE_WIDTH / 2;
  const xMax = boundaries.xMax - PADDLE_WIDTH / 2;

  if (inputs.has("a")) {
    paddles[0].pos.x = Math.max(xMin, paddles[0].pos.x - PADDLE_SPEED);
  }

  if (inputs.has("d")) {
    paddles[0].pos.x = Math.min(xMax, paddles[0].pos.x + PADDLE_SPEED);
  }

  if (inputs.has("ArrowLeft")) {
    paddles[1].pos.x = Math.max(xMin, paddles[1].pos.x - PADDLE_SPEED);
  }

  if (inputs.has("ArrowRight")) {
    paddles[1].pos.x = Math.min(xMax, paddles[1].pos.x + PADDLE_SPEED);
  }

  return paddles;
}

/**
 * If the space bar is pressed (`input.has(" ")`) the ball should be
 * served (released) by whichever paddle is serving. But otherwise
 * everything is left unchanged.
 *
 * @param {State} state
 * @param {Inputs} inputs
 * @returns {ServingPaddle}
 */
function updateServingPaddle({ servingPaddle: oldServingPaddle }, inputs) {
  if (oldServingPaddle === null) {
    // The ball is in active play, there is nothing to change.
    return null;
  }

  if (inputs.has(" ")) {
    // A player pressed the space bar. Let’s release the ball.
    return null;
  }

  // The ball shall remain with whomever has it.
  return oldServingPaddle;
}

/**
 * Return the new state of the ball after calculated all collisions.
 *
 * @param {State} state - The current state
 * @param {State} oldState - The previous state
 * @returns {Ball} - The new state of the ball
 */
function updateBall(state, oldState) {
  // sin and cos are built in trigonomic functions. You’ll learn about trig
  // functions in an advanced math class. They are super useful for drawing.
  // Basically cos(angle) is how much your x coordinate, changes and sin(angle)
  // is how much your y coordinate changes. Multiply by speed.

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
    // We don’t need to see anything else. We can safely return from this
    // function.
    return {
      pos: { x: state.paddles[state.servingPaddle].pos.x, y },
      speed: 0,
      angle: 0,
    };
  }

  // Make a copy of the old ball state to keep our record straight.
  const oldBall = structuredClone(state.ball);

  if (oldBall.speed === 0) {
    // The ball is not moving, it must have been served in this frame.
    let angle = 0;

    if (oldState.servingPaddle === 0) {
      // Top paddle has it, shoot it downwards (π/2 radians = 90 deg).
      angle = Math.PI / 2;
    } else {
      // -π/2 radians = -90 deg is straight up.
      angle = -Math.PI / 2;
    }

    // We have seen everything we need to see. Return early.
    return {
      pos: oldBall.pos,
      speed: BALL_SPEED,
      angle,
    };
  }

  // Our new position. This will be updated as needed.
  const pos = {
    x: oldBall.pos.x + oldBall.speed * Math.cos(oldBall.angle),
    y: oldBall.pos.y + oldBall.speed * Math.sin(oldBall.angle),
  };

  // The new momentum.
  let angle = oldBall.angle;
  let speed = oldBall.speed;

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
 * See if we need to increment the points for either player and put
 * the ball into a serving position.
 *
 * @param {State} state
 * @returns {{score: Score, newServingPaddle: ServingPaddle}}
 */
function updateScore({ ball, boundaries, score }) {
  // See if we hit the top.
  if (ball.pos.y - BALL_RADIUS < boundaries.yMin) {
    return {
      // Player 2 gets a point.
      score: [score[0], score[1] + 1],
      // The ball resets to Player 1 paddle
      newServingPaddle: 0,
    };
  }

  if (ball.pos.y + BALL_RADIUS > boundaries.yMax) {
    return {
      // Player 1 gets a point.
      score: [score[0] + 1, score[1]],
      // The ball resets to Player 2 paddle
      newServingPaddle: 1,
    };
  }

  // Same score, nothing changes.
  return {
    score,
    newServingPaddle: null,
  };
}

/**
 * Update the state of the game. Recalculate all the positions, all momentum,
 * react to interactions, collisions, and user inputs.
 *
 * @param {State} state
 * @param {Inputs} inputs
 * @returns {void}
 */
function updateState(state, inputs) {
  let servingPaddle = updateServingPaddle(state, inputs);
  const paddles = updatePaddles(state, inputs);

  // We need the updated paddle position to see what happens to the
  // ball.
  let ball = updateBall({ ...state, paddles, servingPaddle }, state);

  // We need the updated ball position to see what happens to the
  // score.
  const { score, newServingPaddle } = updateScore({ ...state, ball });

  if (newServingPaddle !== null) {
    // Somebody just scored a point. That overwrites previous
    // calculations.
    servingPaddle = newServingPaddle;

    // And we need to recalculate where the ball is based on that.
    ball = updateBall({ ...state, servingPaddle }, state);
  }

  state.servingPaddle = servingPaddle;
  state.paddles = paddles;
  state.ball = ball;
  state.score = score;
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
 * @param {Score} score
 * @returns {void}
 */
function drawScore(ctx, score) {
  const fontSize = Math.round(ctx.canvas.height / 4);
  const center = ctx.canvas.width / 2;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = "lightgray";
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
function render(ctx, state) {
  // Clear the canvas with a white background
  ctx.fillStyle = "white";
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fill();

  drawScore(ctx, state.score);
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

  if (!(ctx instanceof CanvasRenderingContext2D)) {
    return;
  }

  const inputs = createInputCollector();
  const state = createState(canvas);

  for await (const _frame of animationFrames()) {
    updateState(state, inputs);
    render(ctx, state);
  }
}

document.addEventListener("DOMContentLoaded", main);
