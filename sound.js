/**
 * @typedef {import("state").State} State
 * @typedef {import("collision-detectors").Collisions} Collisions
 */

const audioCtx = new AudioContext();
audioCtx.suspend();

export function prepareSound() {
  const soundButton = document.querySelector(".sound-button");

  if (!soundButton) {
    return;
  }

  soundButton.addEventListener("click", () => {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
      soundButton.textContent = "Sound: On";
    } else {
      audioCtx.suspend();
      soundButton.textContent = "Sound: Off";
    }
  });
}

function playWallHit() {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.value = 580;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.2;
  gain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.3);
  gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.3, 0.5);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
}

function playPaddleHit() {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.value = 440;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.2;
  gain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.3);
  gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.3, 0.5);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
}

function playGoal() {
  const length = 0.6;
  const stopTime = audioCtx.currentTime + length;

  const oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.value = 2093;

  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 2;
  lfoGain.connect(oscillator.frequency);

  const lfo = audioCtx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 20;
  lfo.connect(lfoGain);
  lfo.start();
  lfo.stop(stopTime);

  const gain = audioCtx.createGain();
  gain.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.05);
  gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.05, length - 0.05);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(stopTime);
}

function playPaddleServe() {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.value = 300;
  oscillator.frequency.setTargetAtTime(600, audioCtx.currentTime, 0.6);

  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.3);
  gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.3, 0.6);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.6);
}

/**
 * @param {Collisions} collisions
 * @param {State} state
 * @param {State} oldState
 */
export function playSounds(collisions, state, oldState) {
  if (audioCtx.state !== "running") {
    return;
  }

  for (const collision of collisions) {
    if (collision.type === "ball.paddle") {
      playPaddleHit();
    } else if (collision.type === "ball.wall") {
      playWallHit();
    } else if (collision.type === "ball.goal") {
      playGoal();
    }
  }

  if (oldState.isServing !== null && state.isServing === null) {
    playPaddleServe();
  }
}
