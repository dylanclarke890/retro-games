var PONG = PONG || {};

PONG.Ball = class {
  constructor(trajectory) {
    this.x = canvas.width / 2 - 5;
    this.y = canvas.height / 2 - 5;
    this.r = 10;
    this.speed = 3;
    this.startingSpeed = this.speed;
    this.maxSpeed = 12;
    this.collisionCount = 0;
    this.trajectory = trajectory;
  }

  top() {
    return this.y - this.r;
  }

  bottom() {
    return this.y + this.r;
  }

  left() {
    return this.x - this.r;
  }

  right() {
    return this.x + this.r;
  }

  hasCollidedWithPaddle(paddle) {
    let hasCollided = false;
    const { LEFT, RIGHT } = FIELD_SIDE_POS;
    if (
      paddle.x === LEFT.paddleX &&
      this.left() <= paddle.right() &&
      this.left() >= paddle.left()
    ) {
      this.trajectory.x = DIRECTION.RIGHT;
      hasCollided = true;
    } else if (
      paddle.x === RIGHT.paddleX &&
      this.right() >= paddle.left() &&
      this.right() <= paddle.right()
    ) {
      this.trajectory.x = DIRECTION.LEFT;
      hasCollided = true;
    }
    return hasCollided;
  }

  update() {
    if (state.countdown) return;

    const xMovement = this.trajectory.x === DIRECTION.LEFT ? this.speed : -this.speed;
    const yMovement = this.trajectory.y === DIRECTION.UP ? this.speed : -this.speed;

    this.x = Math.floor(this.x - xMovement);
    this.y = Math.floor(this.y - yMovement);

    let hasCollided = false;
    // Check if it has collided with the top or bottom boundary.
    if (this.top() <= 0) {
      this.trajectory.y = DIRECTION.DOWN;
      hasCollided = true;
    }
    if (this.bottom() >= canvas.height) {
      this.trajectory.y = DIRECTION.UP;
      hasCollided = true;
    }

    // Check for collision with either player's paddle.
    const { playerOne, playerTwo } = board;
    if (playerOne.isInYAxisOfBall(this)) hasCollided = this.hasCollidedWithPaddle(playerOne);
    if (playerTwo.isInYAxisOfBall(this)) hasCollided = this.hasCollidedWithPaddle(playerTwo);

    // Check for collision with the left and right side of the screen.
    if (this.right() >= canvas.width) {
      state.roundWon = true;
      state.winner = playerOne.x === FIELD_SIDE_POS.LEFT.paddleX ? playerOne : playerTwo;
    }
    if (this.left() <= 0) {
      state.roundWon = true;
      state.winner = playerTwo.x === FIELD_SIDE_POS.RIGHT.paddleX ? playerTwo : playerOne;
    }

    // Periodically increase the speed based off of the amount of collisions.
    if (hasCollided) {
      this.collisionCount++;
      audio.collision.currentTime = 0;
      audio.collision.play();
    }
    if (this.collisionCount > 0 && this.collisionCount % 5 === 0) {
      this.speed = Math.min(this.speed + 1, this.maxSpeed);
      this.collisionCount = 0; // otherwise will infinitely speed up once it first hits 5.
    }
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
    ctx.fill();
  }
};

PONG.Paddle = PONG.Paddle || {};

PONG.Paddle.Base = class {
  constructor(name, fieldPosition, maxSpeed) {
    this.name = name;
    this.h = 80;
    this.w = 20;
    this.x = fieldPosition.paddleX;
    this.y = canvas.height / 2 - this.h / 2;
    this.paddleSpeed = maxSpeed;
    this.score = 0;
    this.scoreX = fieldPosition.scoreX; // position of score
  }

  top() {
    return this.y;
  }

  bottom() {
    return this.y + this.h;
  }

  centerX() {
    return this.x + this.w / 2;
  }

  centerY() {
    return this.y + this.h / 2;
  }

  left() {
    return this.x;
  }

  right() {
    return this.x + this.w;
  }

  isInYAxisOfBall(ball) {
    return ball.top() >= this.top() && ball.bottom() <= this.bottom();
  }

  setYPosition(movement) {
    if (this.top() + movement < 0) this.y = 0;
    else if (this.bottom() + movement > canvas.height) this.y = canvas.height - this.h;
    else this.y += movement;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  update() {
    throw new Error("Not implemented on base class.");
  }
};

PONG.Paddle.Pong = class extends PONG.Paddle.Base {
  constructor(fieldPosition, maxSpeed) {
    super("Pong", fieldPosition, maxSpeed);
  }

  update() {
    const ball = board.ball;
    let movement;
    if (ball.bottom() < this.centerY())
      movement = Math.max(-this.paddleSpeed, ball.bottom() - this.centerY());
    else if (ball.top() > this.centerY())
      movement = Math.min(this.paddleSpeed, ball.top() - this.centerY());
    else movement = 0;
    this.setYPosition(movement);
  }
};

PONG.Paddle.Player = class extends PONG.Paddle.Base {
  constructor(name, controlsType, x) {
    super(name, x, 10);
    this.controlsType = controlsType || "Standard";
  }

  update() {
    let movement;
    switch (this.controlsType) {
      default:
        break;
      case "Standard":
        if (!state.controls.standard.pressing) return;
        movement =
          state.controls.standard.direction === DIRECTION.UP ? -this.paddleSpeed : this.paddleSpeed;
        break;
      case "Alt":
        if (!state.controls.alt.pressing) return;
        movement =
          state.controls.alt.direction === DIRECTION.UP ? -this.paddleSpeed : this.paddleSpeed;
        break;
    }
    this.setYPosition(movement);
  }
};

PONG.utils = PONG.utils || {};

PONG.utils.drawText = function (text, font, fillStyle, x, y, maxWidth = undefined) {
  if (font) ctx.font = font;
  if (fillStyle) ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y, maxWidth);
};

/********************************************************
 *                  G L O B A L S
 */
const DIRECTION = {
  UP: "U",
  DOWN: "D",
  LEFT: "L",
  RIGHT: "R",
};

const board = {
  playerOne: new PONG.Paddle.Player("Dylan", "Standard", p1StartingSide),
  playerTwo: pvp
    ? new PONG.Paddle.Player("Krys", "Alt", p2StartingSide)
    : new PONG.Paddle.Pong(p2StartingSide, aiMaxPaddleSpeed),
  ball: new PONG.Ball({
    // randomly select left/right and up/down as starting directions for the ball
    x: [DIRECTION.LEFT, DIRECTION.RIGHT][randUpTo(2, true)],
    y: [DIRECTION.UP, DIRECTION.DOWN][randUpTo(2, true)],
  }),
  winningScore: 6,
};

const state = {
  countdown: 180,
  frame: 0,
  controls: {
    standard: {
      pressing: false,
      direction: "",
    },
    alt: {
      pressing: false,
      direction: "",
    },
  },
  roundWon: false,
  over: false,
  winner: null,
};

/********************************************************************
 *                          E V E N T S
 */

window.addEventListener("keydown", (e) => {
  const pressingUp = { pressing: true, direction: DIRECTION.UP };
  const pressingDown = { pressing: true, direction: DIRECTION.DOWN };
  switch (e.key.toLowerCase()) {
    case "arrowup":
      state.controls.standard = pressingUp;
      break;
    case "arrowdown":
      state.controls.standard = pressingDown;
      break;
    case "w":
      state.controls.alt = pressingUp;
      break;
    case "s":
      state.controls.alt = pressingDown;
      break;
    default:
      break;
  }
});

window.addEventListener("keyup", (e) => {
  const noPress = { pressing: false, direction: "" };
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "arrowdown":
      state.controls.standard = noPress;
      break;
    case "w":
    case "s":
      state.controls.alt = noPress;
      break;
    default:
      break;
  }
});

/********************************************************************
 *                            M A I N
 */

function handlePlayerPaddle() {
  board.playerOne.draw();
  board.playerOne.update();
}

function handleEnemyPaddle() {
  board.playerTwo.draw();
  board.playerTwo.update();
}

function handleBall() {
  board.ball.draw();
  board.ball.update();
}

function handleGameState() {
  const { playerOne, playerTwo, winningScore, ball } = board;
  if (state.roundWon) {
    state.winner.score++;
    state.winner = null;
    if (playerOne.score >= winningScore) {
      state.over = true;
      state.winner = playerOne;
    } else if (playerTwo.score >= winningScore) {
      state.over = true;
      state.winner = playerTwo;
    }
    if (!state.over) {
      const { r, speed, startingSpeed } = ball;
      ball.x = center.w - r / 2;
      ball.y = center.h - r / 2;
      ball.speed = Math.max(speed - 3, startingSpeed);
      state.countdown = 180;
      state.roundWon = false;
    }
  }

  if (state.over)
    PONG.utils.drawText(
      `${state.winner.name} Wins!`,
      "60px Arial",
      "white",
      center.w - 200,
      center.h
    );

  PONG.utils.drawText(playerOne.score, "30px Arial", "white", playerOne.scoreX, 25);
  PONG.utils.drawText(playerTwo.score, "30px Arial", "white", playerTwo.scoreX, 25);
  this.frame++;
}

function handleCountDown() {
  if (state.countdown === 0) return;
  state.countdown--;
  PONG.utils.drawText(Math.ceil(state.countdown / 60), "60px Arial", "white", center.w, center.h);
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleEnemyPaddle();
  handlePlayerPaddle();
  handleBall();
  handleGameState();
  handleCountDown();
  if (!state.over) requestAnimationFrame(animate);
})();
