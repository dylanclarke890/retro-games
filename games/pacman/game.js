const [canvas, ctx] = new2dCanvas("play-area", 440, 560);

const pressed = {
  up: { key: "ArrowUp", is: false },
  down: { key: "ArrowDown", is: false },
  left: { key: "ArrowLeft", is: false },
  right: { key: "ArrowRight", is: false },
  last: "",
};

const FPS = 60;
const settings = {
  fps: FPS,
  fpsInterval: 1000 / FPS,
  cellSize: 40,
  pacmanR: 15,
  pacmanSpeed: 4,
  pacmanMouthStep: 0.25,
  pacmanMaxMouth: 0.75,
  pacmanMouthInterval: 0.1, // in seconds
  offset: 3,
  ghostR: 15,
  ghostSpeed: 3,
  ghostPoints: 100,
  ghostScaredColor: "blue",
  ghostFlashColor: "grey",
  ghostScaredTime: 5, // in seconds
  ghostScaredFlashInterval: 0.25, // in seconds
  ghostScaredFlashBelow: 2, // in seconds
  pelletR: 3,
  pelletPoints: 10,
  powerupR: 5,
  powerupPoints: 50,
  topbarOffset: 40,
};

function isCircleRectCollision(c, r, offset = settings.offset) {
  return (
    c.y - c.r + c.velocity.y - offset <= r.y + r.h &&
    c.x + c.r + c.velocity.x + offset >= r.x &&
    c.y + c.r + c.velocity.y + offset >= r.y &&
    c.x - c.r + c.velocity.x - offset <= r.x + r.w
  );
}

function circlesAreColliding(c1, c2) {
  return Math.hypot(c1.x - c2.x, c1.y - c2.y) < c1.r + c2.r;
}

window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "ArrowUp":
      pressed.up.is = true;
      break;
    case "ArrowDown":
      pressed.down.is = true;
      break;
    case "ArrowRight":
      pressed.right.is = true;
      break;
    case "ArrowLeft":
      pressed.left.is = true;
      break;
    default:
      break;
  }
  pressed.last = e.code;
});

window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "ArrowUp":
      pressed.up.is = false;
      break;
    case "ArrowDown":
      pressed.down.is = false;
      break;
    case "ArrowRight":
      pressed.right.is = false;
      break;
    case "ArrowLeft":
      pressed.left.is = false;
      break;
    default:
      break;
  }
});

class Boundary {
  constructor(x, y, image) {
    this.x = x;
    this.y = y;
    this.w = settings.cellSize;
    this.h = settings.cellSize;
    this.image = image;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y);
  }
}

class Player {
  static speed = settings.pacmanSpeed;
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.r = settings.pacmanR;
    this.radians = 0.5;
    this.mouthTimer = Math.floor(settings.fps * settings.pacmanMouthInterval);
    this.opening = false;
    this.rotation = 0;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.translate(-this.x, -this.y);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, this.radians, Math.PI * 2 - this.radians);
    ctx.lineTo(this.x, this.y);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update() {
    const { fps, pacmanMaxMouth, pacmanMouthInterval, pacmanMouthStep } = settings;

    for (let i = 0; i < ghosts.length; i++) {
      const ghost = ghosts[i];
      if (circlesAreColliding(this, ghost)) {
        if (ghost.scaredTimer > 0) {
          ghost.eaten = true;
        } else {
          winState = -1;
          return;
        }
      }
    }

    switch (pressed.last) {
      case pressed.right.key:
        if (this.willCollideWithABoundary(Player.speed, 0)) {
          this.velocity.x = 0;
        } else {
          this.velocity.x = Player.speed;
          this.velocity.y = 0;
        }
        break;
      case pressed.left.key:
        if (this.willCollideWithABoundary(-Player.speed, 0)) {
          this.velocity.x = 0;
        } else {
          this.velocity.x = -Player.speed;
          this.velocity.y = 0;
        }
        break;
      case pressed.down.key:
        if (this.willCollideWithABoundary(0, Player.speed)) {
          this.velocity.y = 0;
        } else {
          this.velocity.x = 0;
          this.velocity.y = Player.speed;
        }
        break;
      case pressed.up.key:
        if (this.willCollideWithABoundary(0, -Player.speed)) {
          this.velocity.y = 0;
        } else {
          this.velocity.x = 0;
          this.velocity.y = -Player.speed;
        }
        break;
      default:
        break;
    }

    if (this.willCollideWithABoundary(this.velocity.x, this.velocity.y)) {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    if (this.mouthTimer > 0) {
      this.mouthTimer--;
      if (this.mouthTimer === 0) {
        if (!(this.velocity.x === 0 && this.velocity.y === 0)) {
          if (this.radians < pacmanMaxMouth && this.opening) {
            this.radians += pacmanMouthStep;
            if (this.radians === pacmanMaxMouth) this.opening = false;
          }
          if (this.radians > 0 && !this.opening) {
            this.radians -= pacmanMouthStep;
            if (this.radians === 0) this.opening = true;
          }
        }
        this.mouthTimer = Math.floor(fps * pacmanMouthInterval);
      }
    }

    if (this.x + this.r < 0) {
      this.x = canvas.width + this.r;
      this.velocity.x = -Player.speed;
    } else if (this.x > canvas.width + this.r) {
      this.x = 0 - this.r;
      this.velocity.x = Player.speed;
    }

    if (player.velocity.x > 0) player.rotation = 0;
    else if (player.velocity.x < 0) player.rotation = Math.PI;
    else if (player.velocity.y > 0) player.rotation = Math.PI / 2;
    else if (player.velocity.y < 0) player.rotation = Math.PI * 1.5;
  }

  willCollideWithABoundary(xv, yv) {
    for (let i = 0; i < boundaries.length; i++)
      if (
        isCircleRectCollision({ ...this, velocity: { x: xv, y: yv } }, boundaries[i], Player.speed)
      )
        return true;
    return false;
  }
}

class Ghost {
  static speed = settings.ghostSpeed;
  static scaredColor = settings.ghostScaredColor;
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.velocity = { x: settings.ghostSpeed, y: 0 };
    this.r = settings.ghostR;
    this.color = color;
    this.prevCollisions = [];
    this.scaredTimer = 0;
    this.eaten = false;
    this.blink = false;
  }

  draw() {
    const {
      fps,
      ghostScaredFlashBelow,
      ghostScaredFlashInterval,
      ghostFlashColor,
      ghostScaredColor,
    } = settings;

    if (this.scaredTimer > 0) {
      if (this.scaredTimer < fps * ghostScaredFlashBelow) {
        if (this.scaredTimer % (fps * ghostScaredFlashInterval) === 0) this.blink = !this.blink;
        ctx.fillStyle = this.blink ? ghostFlashColor : ghostScaredColor;
      } else ctx.fillStyle = ghostScaredColor;
    } else ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  update() {
    if (this.scaredTimer > 0) {
      this.scaredTimer--;
    }

    const collisions = [];
    for (let i = 0; i < boundaries.length; i++) {
      if (
        !collisions.includes("l") &&
        isCircleRectCollision(
          { ...this, velocity: { x: -Ghost.speed, y: 0 } },
          boundaries[i],
          Ghost.speed
        )
      )
        collisions.push("l");
      if (
        !collisions.includes("r") &&
        isCircleRectCollision(
          { ...this, velocity: { x: Ghost.speed, y: 0 } },
          boundaries[i],
          Ghost.speed
        )
      )
        collisions.push("r");
      if (
        !collisions.includes("u") &&
        isCircleRectCollision(
          { ...this, velocity: { x: 0, y: -Ghost.speed } },
          boundaries[i],
          Ghost.speed
        )
      )
        collisions.push("u");
      if (
        !collisions.includes("d") &&
        isCircleRectCollision(
          { ...this, velocity: { x: 0, y: Ghost.speed } },
          boundaries[i],
          Ghost.speed
        )
      )
        collisions.push("d");
    }

    if (collisions.length > this.prevCollisions.length) this.prevCollisions = collisions;

    if (JSON.stringify(collisions) !== JSON.stringify(this.prevCollisions)) {
      if (this.velocity.x > 0) this.prevCollisions.push("r");
      else if (this.velocity.x < 0) this.prevCollisions.push("l");
      else if (this.velocity.y > 0) this.prevCollisions.push("d");
      else if (this.velocity.y < 0) this.prevCollisions.push("u");

      const pathways = this.prevCollisions.filter((c) => !collisions.includes(c));

      const dir = pathways[Math.floor(Math.random() * pathways.length)];
      switch (dir) {
        case "u":
          this.velocity.x = 0;
          this.velocity.y = -Ghost.speed;
          break;
        case "d":
          this.velocity.x = 0;
          this.velocity.y = Ghost.speed;
          break;
        case "l":
          this.velocity.x = -Ghost.speed;
          this.velocity.y = 0;
          break;
        case "r":
          this.velocity.x = Ghost.speed;
          this.velocity.y = 0;
          break;
        default:
          break;
      }
      this.prevCollisions = [];
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;
    if (this.x + this.r < 0) {
      this.x = canvas.width + this.r;
      this.velocity.x = -Ghost.speed;
    } else if (this.x > canvas.width + this.r) {
      this.x = 0 - this.r;
      this.velocity.x = Ghost.speed;
    }
  }
}

class Pellet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = settings.pelletR;
    this.collected = false;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  update() {
    if (circlesAreColliding(this, player)) this.collected = true;
  }
}

class Powerup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = settings.powerupR;
    this.collected = false;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  update() {
    if (circlesAreColliding(this, player)) this.collected = true;
  }
}

const map = [
  ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
  ["|", "o", ".", ".", "R", "G", "B", ".", ".", "o", "|"],
  ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
  ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
  ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
  ["_", ".", ".", ".", ".", "^", ".", ".", ".", ".", "_"],
  [" ", ".", "b", ".", "[", "+", "]", ".", "b", ".", " "],
  ["^", ".", ".", ".", ".", "_", ".", ".", ".", ".", "^"],
  ["|", ".", "[", "]", ".", "P", ".", "[", "]", ".", "|"],
  ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
  ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
  ["|", "o", ".", ".", ".", ".", ".", ".", ".", "o", "|"],
  ["3", "-", "-", "-", "-", "-", "-", "-", "-", "-", "4"],
];

let boundaries = [];
let pellets = [];
let powerups = [];
let ghosts = [];
let score = 0;
let winState = 0;
let player;

const assets = {
  block: "./assets/block.png",
  cap: {
    top: "./assets/capTop.png",
    right: "./assets/capRight.png",
    left: "./assets/capLeft.png",
    bottom: "./assets/capBottom.png",
  },
  pipe: {
    horizontal: "./assets/pipeHorizontal.png",
    vertical: "./assets/pipeVertical.png",
    cross: "./assets/pipeCross.png",
    bottomRight: "./assets/pipeCornerBR.png",
    bottomLeft: "./assets/pipeCornerBL.png",
    topRight: "./assets/pipeCornerTR.png",
    topLeft: "./assets/pipeCornerTL.png",
  },
  pipeConnector: {
    top: "./assets/pipeConnectorTop.png",
    right: "./assets/pipeConnectorRight.png",
    left: "./assets/pipeConnectorLeft.png",
    bottom: "./assets/pipeConnectorBottom.png",
    downwards: "./assets/pipeConnectorDownwards.png",
  },
};

function newImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

(function setUpMap() {
  const { cellSize, topbarOffset } = settings;
  map.forEach((row, i) => {
    row.forEach((cell, j) => {
      const x = j * cellSize,
        y = i * cellSize + topbarOffset;
      switch (cell) {
        case "-":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.horizontal)));
          break;
        case "|":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.vertical)));
          break;
        case "1":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.topLeft)));
          break;
        case "2":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.topRight)));
          break;
        case "3":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.bottomLeft)));
          break;
        case "4":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.bottomRight)));
          break;
        case "b":
          boundaries.push(new Boundary(x, y, newImage(assets.block)));
          break;
        case "[":
          boundaries.push(new Boundary(x, y, newImage(assets.cap.left)));
          break;
        case "]":
          boundaries.push(new Boundary(x, y, newImage(assets.cap.right)));
          break;
        case "_":
          boundaries.push(new Boundary(x, y, newImage(assets.cap.bottom)));
          break;
        case "^":
          boundaries.push(new Boundary(x, y, newImage(assets.cap.top)));
          break;
        case "+":
          boundaries.push(new Boundary(x, y, newImage(assets.pipe.cross)));
          break;
        case "5":
          boundaries.push(new Boundary(x, y, newImage(assets.pipeConnector.top)));
          break;
        case "6":
          boundaries.push(new Boundary(x, y, newImage(assets.pipeConnector.right)));
          break;
        case "7":
          boundaries.push(new Boundary(x, y, newImage(assets.pipeConnector.bottom)));
          break;
        case "8":
          boundaries.push(new Boundary(x, y, newImage(assets.pipeConnector.left)));
          break;
        case ".":
          pellets.push(new Pellet(x + cellSize / 2, y + cellSize / 2));
          break;
        case "o":
          powerups.push(new Powerup(x + cellSize / 2, y + cellSize / 2));
          break;
        case "P":
          player = new Player(x + cellSize / 2, y + cellSize / 2);
          break;
        case "R":
          ghosts.push(new Ghost(x + cellSize / 2, y + cellSize / 2, "red"));
          break;
        case "G":
          ghosts.push(new Ghost(x + cellSize / 2, y + cellSize / 2, "green"));
          break;
        case "B":
          ghosts.push(new Ghost(x + cellSize / 2, y + cellSize / 2, "pink"));
          break;
        default:
          break;
      }
    });
  });
})();

function handleGameLoop() {
  for (let i = 0; i < boundaries.length; i++) {
    boundaries[i].draw();
  }
  for (let i = 0; i < pellets.length; i++) {
    pellets[i].draw();
    pellets[i].update();
  }
  for (let i = 0; i < powerups.length; i++) {
    powerups[i].draw();
    powerups[i].update();
  }
  for (let i = 0; i < ghosts.length; i++) {
    ghosts[i].draw();
    ghosts[i].update();
  }
  player.draw();
  player.update();

  const oP = pellets.length;
  const oG = ghosts.length;
  const oPU = powerups.length;

  pellets = pellets.filter((p) => !p.collected);
  powerups = powerups.filter((p) => !p.collected);
  ghosts = ghosts.filter((p) => !p.eaten);

  const pelletsRemoved = oP - pellets.length;
  const powerupsRemoved = oPU - powerups.length;
  const ghostsRemoved = oG - ghosts.length;
  score += pelletsRemoved * settings.pelletPoints;
  score += powerupsRemoved * settings.powerupPoints;
  score += ghostsRemoved * settings.ghostPoints;

  if (powerupsRemoved > 0) {
    for (let i = 0; i < ghosts.length; i++) {
      ghosts[i].scaredTimer = settings.fps * settings.ghostScaredTime;
    }
  }

  if (pellets.length === 0) winState = 1;
}

function handleGameOver() {
  ctx.font = "30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(`GAME OVER`, canvas.width / 2, canvas.height / 2);
}

function handleGameWin() {
  ctx.font = "30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(`YOU WIN`, canvas.width / 2, canvas.height / 2);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  switch (winState) {
    case 1:
      handleGameWin();
      break;
    case 0:
      handleGameLoop();
      break;
    case -1:
      handleGameOver();
      break;
    default:
      break;
  }
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 25);
}

let stop = false,
  now,
  lastFrame;

(function startAnimating() {
  lastFrame = window.performance.now();
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
