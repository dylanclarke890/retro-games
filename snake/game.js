function new2dCanvas(id, width, height) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  return [canvas, ctx];
}

function drawText(text, font, fillStyle, x, y, maxWidth = undefined) {
  if (font) ctx.font = font;
  if (fillStyle) ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y, maxWidth);
}

function isColliding(first, second) {
  if (!first || !second) return false;
  if (
    !(
      first.x > second.x + second.w ||
      first.x + first.w < second.x ||
      first.y > second.y + second.h ||
      first.y + first.h < second.y
    )
  ) {
    return true;
  }
  return false;
}

const [canvas, ctx] = new2dCanvas("play-area", 800, 500);

class Segment {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = settings.segmentSize;
    this.h = settings.segmentSize;
  }

  draw() {
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "transparent";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}

class Snake {
  constructor() {
    this.speed = settings.segmentSize;
    const x =
      Math.floor((Math.random() * canvas.width) / settings.segmentSize) *
      settings.segmentSize;
    const y =
      Math.floor((Math.random() * canvas.height) / settings.segmentSize) *
      settings.segmentSize;
    this.head = new Segment(x, y);
    this.segments = [];
  }

  draw() {
    this.head.draw();
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].draw();
    }
  }

  update() {
    const { moving, frame, over } = state;
    if (frame % settings.movementDelay !== 0 || over) return;

    const prev = {
      x: this.head.x,
      y: this.head.y,
    };
    switch (moving) {
      case DIRECTIONS.LEFT:
        this.head.x -= this.speed;
        break;
      case DIRECTIONS.RIGHT:
        this.head.x += this.speed;
        break;
      case DIRECTIONS.UP:
        this.head.y -= this.speed;
        break;
      case DIRECTIONS.DOWN:
        this.head.y += this.speed;
        break;
      default:
        break;
    }

    for (let i = 0; i < this.segments.length; i++) {
      const temp = {
        x: this.segments[i].x,
        y: this.segments[i].y,
      };
      this.segments[i].x = prev.x;
      this.segments[i].y = prev.y;
      prev.x = temp.x;
      prev.y = temp.y;
    }

    if (
      this.head.y < 0 ||
      this.head.y + this.head.h > canvas.height ||
      this.head.x < 0 ||
      this.head.x + this.head.w > canvas.width ||
      this.segments.some(
        (segment) => this.head.x === segment.x && this.head.y === segment.y
      )
    )
      state.over = true;
  }

  addSegment() {
    const tail = this.segments[this.segments.length - 1] || this.head;
    this.segments.push(new Segment(tail.x, tail.y));
  }
}

class Objective {
  constructor() {
    this.x =
      Math.floor((Math.random() * canvas.width) / settings.segmentSize) *
      settings.segmentSize;
    this.y =
      Math.floor((Math.random() * canvas.height) / settings.segmentSize) *
      settings.segmentSize;
    this.w = settings.dropSize;
    this.h = settings.dropSize;
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x + this.w / 2, this.y + this.h / 2, this.w, this.h);
  }
}

const DIRECTIONS = {
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down",
};

const defaultSettings = {
  segmentSize: 20,
  movementDelay: 50,
  minDelay: 5,
  dropSize: 10,
};

let settings = defaultSettings;

let defaultState = () => ({
  started: false,
  snake: new Snake(),
  over: false,
  moving: DIRECTIONS.RIGHT,
  frame: 0,
  objective: null,
  score: 0,
});

let state = defaultState();

window.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      if (state.moving !== DIRECTIONS.DOWN) state.moving = DIRECTIONS.UP;
      break;
    case "arrowdown":
    case "s":
      if (state.moving !== DIRECTIONS.UP) state.moving = DIRECTIONS.DOWN;
      break;
    case "arrowleft":
    case "a":
      if (state.moving !== DIRECTIONS.RIGHT) state.moving = DIRECTIONS.LEFT;
      break;
    case "arrowright":
    case "d":
      if (state.moving !== DIRECTIONS.LEFT) state.moving = DIRECTIONS.RIGHT;
      break;
  }
});

function handleSnake() {
  state.snake.update();
  state.snake.draw();
}

function handleObjective() {
  if (state.objective === null) state.objective = new Objective();
  state.objective.draw();
  if (
    state.objective.y === state.snake.head.y &&
    state.objective.x === state.snake.head.x
  ) {
    state.objective = null;
    state.snake.addSegment();
    state.score++;
    if (state.score % 2 === 0 && settings.movementDelay > settings.minDelay)
      settings.movementDelay -= 5;
  }
}

function handleScore() {
  drawText(state.score, "30px Arial", "darkgreen", canvas.width / 2 - 20, 40);
}

function handleGameOver() {
  drawText(
    "GAME OVER",
    "60px Arial",
    "yellow",
    canvas.width / 2 - 200,
    canvas.height / 2 - 100
  );
  drawText(
    `Final Score: ${state.score}`,
    "20px Arial",
    "yellow",
    canvas.width / 2 - 60,
    canvas.height / 2 - 50
  );
  const { x, y, w, h, hover } = startBtn;
  ctx.fillStyle = hover ? "darkgreen" : "green";
  ctx.fillRect(x, y, w, h);
  drawText("Restart", "20px Arial", "yellow", x + 20, y + 20);
}

let canvasPosition = canvas.getBoundingClientRect();

const startBtn = {
  x: canvas.width / 2 - 50,
  y: canvas.height / 2 - 15,
  w: 100,
  h: 30,
  hover: false,
};

const mouse = {
  x: 0,
  y: 0,
  w: 0.1,
  h: 0.1,
};

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
  startBtn.hover = isColliding(mouse, startBtn);
});

canvas.addEventListener("click", (e) => {
  if (!state.started) {
    state.started = isColliding(mouse, startBtn);
  }
  if (state.over && isColliding(mouse, startBtn)) {
    state = defaultState();
    settings = defaultSettings;
  }
});

window.addEventListener("resize", () => {
  canvasPosition = canvas.getBoundingClientRect();
});

function handleStart() {
  drawText(
    "SNAKE",
    "80px Arial",
    "yellow",
    canvas.width / 2 - 150,
    canvas.height / 2 - 100
  );
  const { x, y, w, h, hover } = startBtn;
  ctx.fillStyle = hover ? "darkgreen" : "green";
  ctx.fillRect(x, y, w, h);
  drawText("Start", "20px Arial", "yellow", x + 30, y + 20);
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state.started) {
    handleStart();
    requestAnimationFrame(animate);
    return;
  }
  handleSnake();
  handleObjective();
  handleScore();
  state.frame++;
  if (state.over) {
    handleGameOver();
    requestAnimationFrame(animate);
  } else requestAnimationFrame(animate);
})();
