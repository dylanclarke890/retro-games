function new2dCanvas(id, width, height) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  return [canvas, ctx];
}

const [canvas, ctx] = new2dCanvas("play-area", 600, 600);

const FPS = 60,
  COLS = 10,
  ROWS = 20,
  SIZE = canvas.height / ROWS,
  DEFAULT_MOVE_SPEED = 0.5;

const settings = {
  fps: FPS,
  fpsInterval: 1000 / FPS,
  cols: COLS,
  rows: ROWS,
  size: SIZE,
  boardOffset: COLS * SIZE,
  emptyCellColor: "white",
  blockDescendInterval: DEFAULT_MOVE_SPEED, // in seconds
  keyboardMoveInterval: DEFAULT_MOVE_SPEED / 4,
  defaultPreviewPos: {
    x: COLS + 1,
    y: 5,
  },
  defaultPiecePos: {
    x: 4,
    y: -4,
  },
};
let state;
let board = [];
const pressed = {
  left: false,
  right: false,
  down: false,
};

(function createBoard() {
  const { cols, rows, emptyCellColor } = settings;
  board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyCellColor)
  );
})();

const blockTypes = {
  t: {
    color: "red",
    rotations: [
      [
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 1],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
      [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 0, 1],
      ],
    ],
  },
  z: {
    color: "blue",
    rotations: [
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
    ],
  },
  s: {
    color: "darkgoldenrod",
    rotations: [
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
    ],
  },
  j: {
    color: "green",
    rotations: [
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
    ],
  },
  l: {
    color: "purple",
    rotations: [
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [0, 0, 1],
        [1, 1, 1],
      ],
    ],
  },
  o: {
    color: "hotpink",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
    ],
  },
  i: {
    color: "orange",
    rotations: [
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
    ],
  },
};

function randomPiece() {
  const blocks = Object.keys(blockTypes);
  return blockTypes[blocks[Math.floor(Math.random() * blocks.length)]];
}

// args: array of objects of form
//   { text: string, fillStyle?: string, font?: string }
//
function fillMixedText(args, x, y, stroke = false, strokeColor = "white") {
  let defaultFillStyle = ctx.fillStyle;
  let defaultFont = ctx.font;
  ctx.textAlign = "left";
  ctx.lineWidth = 2;
  ctx.save();
  args.forEach(({ text, fillStyle, font }) => {
    ctx.fillStyle = fillStyle || defaultFillStyle;
    ctx.font = font || defaultFont;
    ctx.fillText(text, x, y);
    if (stroke) {
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(text, x, y);
    }
    x += ctx.measureText(text).width + 2;
  });
  ctx.restore();
}

class Block {
  constructor() {
    this.x = 4;
    this.y = -4;
    const { color, rotations } = randomPiece();
    this.color = color;
    this.rotations = rotations;
    this.downInterval = settings.blockDescendInterval * settings.fps;
    this.timer = 0;
    this.currentRotation = 0;
    this.activeTetromino = this.rotations[this.currentRotation];
    this.locked = false;
  }

  update() {
    const isIntervalOfKeyboardMovement =
      this.timer % (settings.keyboardMoveInterval * settings.fps) === 0;
    if (
      this.timer % this.downInterval === 0 ||
      (pressed.down && isIntervalOfKeyboardMovement)
    ) {
      if (!this.willCollide(0, 1, this.activeTetromino)) this.y++;
      else this.lock();
    }

    if (
      pressed.right &&
      isIntervalOfKeyboardMovement &&
      !this.willCollide(1, 0)
    )
      this.x++;
    if (
      pressed.left &&
      isIntervalOfKeyboardMovement &&
      !this.willCollide(-1, 0)
    )
      this.x--;
    this.timer++;
  }

  draw() {
    for (let r = 0; r < this.activeTetromino.length; r++)
      for (let c = 0; c < this.activeTetromino[r].length; c++)
        if (this.activeTetromino[r][c])
          drawSquare(this.x + c, this.y + r, this.color);
  }

  drawPreviewAt(x, y) {
    for (let r = 0; r < this.rotations[0].length; r++)
      for (let c = 0; c < this.rotations[0][r].length; c++)
        if (this.rotations[0][r][c]) drawSquare(x + c, y + r, this.color);
  }

  nextRotation() {
    const mod = this.rotations.length;
    const next = this.rotations[(this.currentRotation + 1) % mod];
    let kick = this.willCollide(0, 0, next)
      ? this.x > settings.cols / 2
        ? -1
        : 1
      : 0;

    if (!this.willCollide(kick, 0, next)) {
      this.x += kick;
      this.currentRotation++;
      this.activeTetromino = next;
    }
  }

  willCollide(x, y, piece = this.activeTetromino) {
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece.length; c++) {
        if (!piece[r][c]) continue;
        let newX = this.x + c + x;
        let newY = this.y + r + y;
        if (newX < 0 || newX >= settings.cols || newY >= settings.rows)
          return true;
        if (newY < 0) continue;
        if (board[newY][newX] != settings.emptyCellColor) return true;
      }
    }
    return false;
  }

  lock() {
    for (let r = 0; r < this.activeTetromino.length; r++)
      for (let c = 0; c < this.activeTetromino[r].length; c++) {
        if (!this.activeTetromino[r][c]) continue;
        if (this.y + r < 0) {
          state.gameOver = true;
          break;
        }
        this.locked = true;
        board[this.y + r][this.x + c] = this.color;
        removeFullRows();
      }
  }
}

function newGame() {
  const topScore = localStorage.getItem("tetrisScore");
  const topLines = localStorage.getItem("tetrisLinesCleared");
  state = {
    started: false,
    activeBlock: new Block(),
    nextBlock: new Block(),
    gameOver: false,
    score: 0,
    linesCleared: 0,
    best: {
      score: topScore ? parseInt(topScore) : 0,
      linesCleared: topLines ? parseInt(topLines) : 0,
    },
  };
}

function drawSquare(x, y, color) {
  const size = settings.size;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  ctx.fillRect(x * size, y * size, size, size);
  ctx.strokeRect(x * size, y * size, size, size);
}

function drawBoard() {
  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    for (let c = 0; c < row.length; c++) {
      drawSquare(c, r, row[c]);
    }
  }
}

function removeFullRows() {
  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    let rowIsFull = true;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === settings.emptyCellColor) {
        rowIsFull = false;
        break;
      }
    }
    if (rowIsFull) {
      for (let y = r; y > 1; y--)
        for (let c = 0; c < settings.cols; c++) board[y][c] = board[y - 1][c];
      for (let i = 0; i < settings.cols; i++)
        board[0][i] = settings.emptyCellColor;
      state.score += 10;
      state.linesCleared++;
      if (state.score > state.best.score) {
        localStorage.setItem("tetrisScore", state.score);
        state.best.score = state.score;
      }
      if (state.linesCleared > state.best.linesCleared) {
        localStorage.setItem("tetrisLinesCleared", state.linesCleared);
        state.best.linesCleared = state.linesCleared;
      }
    }
  }
}

const scorePos = {
  x: settings.boardOffset,
  y: 30,
};
function drawGameInfo() {
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText(`Current: ${state.score}`, scorePos.x, scorePos.y);
  ctx.fillText(`Cleared: ${state.linesCleared}`, scorePos.x, scorePos.y + 50);

  ctx.textAlign = "right";
  ctx.fillText(`Best: ${state.best.score}`, canvas.width, scorePos.y);
  ctx.fillText(
    `Best: ${state.best.linesCleared}`,
    canvas.width,
    scorePos.y + 50
  );

  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  const currText = "Current:";
  ctx.fillText(currText, scorePos.x + 20, scorePos.y + 100);
  const { defaultPreviewPos } = settings;
  state.activeBlock.drawPreviewAt(defaultPreviewPos.x, defaultPreviewPos.y);

  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  const nextText = "Next:";
  ctx.fillText(nextText, scorePos.x + 240, scorePos.y + 100);
  state.nextBlock.drawPreviewAt(defaultPreviewPos.x + 5, defaultPreviewPos.y);
}

const multicoloredTitle = [
  { text: "T", fillStyle: "red" },
  { text: "E", fillStyle: "orange" },
  { text: "T", fillStyle: "yellow" },
  { text: "R", fillStyle: "green" },
  { text: "I", fillStyle: "blue" },
  { text: "S", fillStyle: "purple" },
];

function drawStartScreen() {
  const pos = {
    x: settings.boardOffset + (canvas.width - settings.boardOffset) / 2,
    y: canvas.height / 2 - 50,
  };
  ctx.font = "80px Bangers cursive";
  fillMixedText(
    multicoloredTitle,
    pos.x - ctx.measureText("TETRIS").width / 2,
    pos.y,
    true
  );

  ctx.font = "30px Bangers cursive";
  const text = "space to start";

  ctx.lineWidth = 4;
  ctx.strokeStyle = "purple";
  const w = ctx.measureText(text).width + 20,
    h = 50;
  const startButtonArgs = [
    settings.boardOffset + ((canvas.width - settings.boardOffset) / 2 - w / 2),
    pos.y + 50,
    w,
    h,
  ];
  ctx.fillStyle = "yellow";
  ctx.fillRect(...startButtonArgs);
  ctx.strokeRect(...startButtonArgs);

  ctx.fillStyle = "green";

  ctx.textAlign = "center";
  ctx.fillText(
    text,
    settings.boardOffset + (canvas.width - settings.boardOffset) / 2,
    pos.y + 85
  );
}

function drawGameOverScreen() {}

window.addEventListener("keyup", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowup":
      state.activeBlock.nextRotation();
      break;
    case "arrowleft":
      pressed.left = false;
      break;
    case "arrowright":
      pressed.right = false;
      break;
    case "arrowdown":
      pressed.down = false;
      break;

    default:
      break;
  }
});

window.addEventListener("keydown", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowleft":
      pressed.left = true;
      break;
    case "arrowright":
      pressed.right = true;
      break;
    case "arrowdown":
      pressed.down = true;
      break;
    case "space":
      if (!state.started) state.started = true;
      break;
    default:
      break;
  }
});

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  if (state.started && !state.gameOver) {
    drawGameInfo();
    state.activeBlock.draw();
    state.activeBlock.update();

    if (state.activeBlock.locked) {
      state.activeBlock = state.nextBlock;
      state.nextBlock = new Block();
    }
  } else if (!state.started) drawStartScreen();
  else drawGameOverScreen();
}

let stop = false,
  now,
  lastFrame;

(function startAnimating() {
  lastFrame = window.performance.now();
  newGame();
  animate();
})();

function animate(newtime) {
  if (stop) return;
  requestAnimationFrame(animate);
  now = newtime;
  const elapsed = now - lastFrame;
  if (elapsed > settings.fpsInterval) {
    lastFrame = now - (elapsed % settings.fpsInterval);
    update();
  }
}
