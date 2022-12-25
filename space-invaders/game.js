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

function randUpTo(num, floor = false) {
  const res = Math.random() * num;
  return floor ? Math.floor(res) : res;
}

function isCircleRectColliding(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + circle.r) return false;
  if (distY > rect.h / 2 + circle.r) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function isRectRectColliding(first, second) {
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
let canvasPosition = canvas.getBoundingClientRect();

const mouse = {
  x: 0,
  y: 0,
  w: 0.1,
  h: 0.1,
};

const keyboard = {
  left: false,
  right: false,
  firing: false,
};

window.addEventListener("keydown", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowright":
      keyboard.right = true;
      break;
    case "arrowleft":
      keyboard.left = true;
      break;
    case "space":
      keyboard.firing = true;
      break;
    default:
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowright":
      keyboard.right = false;
      break;
    case "arrowleft":
      keyboard.left = false;
      break;
    case "space":
      keyboard.firing = false;
      break;
    default:
      break;
  }
});

const setMousePosition = (e) => {
  mouse.x = e.x - (canvasPosition.left + 6);
  mouse.y = e.y - canvasPosition.top;
};

canvas.addEventListener("mousemove", (e) => {
  setMousePosition(e);
});

window.addEventListener("resize", () => {
  canvasPosition = canvas.getBoundingClientRect();
});

canvas.addEventListener("click", (e) => {
  setMousePosition(e);
});

class Player {
  constructor() {
    this.x = canvas.width / 2 - 20;
    this.y = canvas.height - 50;
    this.w = 40;
    this.h = 20;
    this.speed = 10;
    this.cooldownBetweenShots = 50;
    this.currentCooldown = 0;
    this.destroy = false;
  }

  update() {
    if (this.destroy) return;

    if (keyboard.right) this.x += this.speed;
    if (keyboard.left) this.x += -this.speed;
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

    if (this.currentCooldown === 0) {
      if (keyboard.firing) {
        state.projectiles.push(
          new Projectile(this.x + this.w / 2, this.y, -10, { enemies: true })
        );
        this.currentCooldown = this.cooldownBetweenShots;
      }
    } else this.currentCooldown--;
  }

  draw() {
    if (this.destroy) return;
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Projectile {
  constructor(x, y, speed, collideWith) {
    this.x = x;
    this.y = y;
    this.r = 5;
    this.speed = speed;
    this.destroy = false;
    this.collideWith = collideWith;
  }

  update() {
    this.y += this.speed;
    this.destroy = this.y < 0 || this.y > canvas.height;
    state.shields.forEach((shield) => {
      shield.parts.forEach((part) => {
        if (this.destroy) return;
        if (isCircleRectColliding(this, part)) {
          this.destroy = true;
          part.destroy = true;
        }
      });
    });
    const { player, enemies } = this.collideWith;
    if (player && isCircleRectColliding(this, state.player)) {
      state.player.destroy = true;
      this.destroy = true;
    }
    if (!enemies) return;
    state.enemies.forEach((enemyRow) => {
      if (this.destroy) return;
      enemyRow.row.forEach((enemy) => {
        if (this.destroy) return;
        if (isCircleRectColliding(this, enemy)) {
          enemy.destroy = true;
          this.destroy = true;
        }
      });
    });
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = settings.enemy.w;
    this.h = settings.enemy.h;
    this.destroy = false;
    this.cooldownBetweenShots = 50;
    this.currentCooldown = 0;
    this.speedX = 0;
    this.speedY = 0;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.currentCooldown === 0) {
      if (state.frame % 50 === 0 && Math.random() < 0.015) {
        state.projectiles.push(
          new Projectile(this.x + this.w / 2, this.y + this.h, 10, {
            player: true,
          })
        );
        this.currentCooldown = this.cooldownBetweenShots;
      }
    } else this.currentCooldown--;

    state.shields.forEach((shield) => {
      shield.parts.forEach((part) => {
        if (isRectRectColliding(this, part)) {
          part.destroy = true;
        }
      });
    });

    if (isRectRectColliding(this, state.player)) state.player.destroy = true;
  }

  draw() {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class EnemyRow {
  constructor(row) {
    this.row = row;
    this.direction = "R";
    this.destroy = false;
  }

  update() {
    let speedX = 0;
    let speedY = 0;
    if (this.row.length === 0) {
      this.destroy = true;
      return;
    }
    if (state.frame % 100 !== 0) return;
    switch (this.direction) {
      case "R":
        const rightMostEnemy = this.row[this.row.length - 1];
        if (rightMostEnemy.x + rightMostEnemy.w >= canvas.width) {
          speedX = 0;
          speedY = 30;
          this.direction = "DL";
        } else {
          speedX = 30;
          speedY = 0;
        }
        break;
      case "L":
        const leftMostEnemy = this.row[0];
        if (leftMostEnemy.x <= 0) {
          speedX = 0;
          speedY = 30;
          this.direction = "DR";
        } else {
          speedX = -30;
          speedY = 0;
        }
        break;
      case "DR":
        speedX = 30;
        speedY = 0;
        this.direction = "R";
        break;
      case "DL":
        speedX = -30;
        speedY = 0;
        this.direction = "L";
        break;
      default:
        break;
    }

    this.row.forEach((enemy) => {
      enemy.speedX = speedX;
      enemy.speedY = speedY;
      enemy.update();
    });
  }

  draw() {
    this.row.forEach((enemy) => enemy.draw());
  }
}

class Shield {
  constructor(x, y) {
    this.parts = [];
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 6; j++)
        this.parts.push(new ShieldPart(x + i * 10, y + j * 10));
  }

  draw() {
    ctx.fillStyle = "white";
    this.parts.forEach((part) => {
      part.draw();
    });
  }

  update() {}
}

class ShieldPart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 10;
    this.h = 10;
    this.destroy = false;
  }

  draw() {
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

const state = {
  player: new Player(),
  projectiles: [],
  enemies: [],
  frame: 0,
  shields: [],
  won: 0,
};

const settings = {
  enemy: {
    w: 30,
    h: 30,
    gapX: 30,
    gapY: 20,
    offsetX: 50,
    offsetY: 20,
  },
};

(function initialize() {
  const { w, h, gapX, gapY, offsetX, offsetY } = settings.enemy;
  for (let i = 0; i < 5; i++) {
    const row = [];
    for (let j = 0; j < 11; j++) {
      row.push(
        new Enemy(j * w + j * gapX + offsetX, i * h + i * gapY + offsetY)
      );
    }
    state.enemies.push(new EnemyRow(row));
  }

  const y = canvas.height - 150;
  for (let i = 1; i < 4; i++) {
    state.shields.push(new Shield(175 * i, y));
  }
})();

function handleObjects() {
  state.player.update();
  state.player.draw();

  for (let i = 0; i < state.projectiles.length; i++) {
    const projectile = state.projectiles[i];
    projectile.update();
    projectile.draw();
  }

  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    enemy.update();
    enemy.draw();
  }

  for (let i = 0; i < state.shields.length; i++) {
    const shield = state.shields[i];
    shield.update();
    shield.draw();
  }
}

function handleGameState() {
  if (state.player.destroy) state.won = -1;
  if (state.enemies.length === 0) state.won = 1;
}

function handleLossScreen() {
  drawText(
    "Game Over",
    "40px Arial",
    "white",
    canvas.width / 2 - 100,
    canvas.height / 2 - 150
  );
}

function handleWinScreen() {
  drawText(
    "You Won",
    "40px Arial",
    "white",
    canvas.width / 2 - 100,
    canvas.height / 2 - 200
  );
}

const whereNotDestroyed = (arr) => arr.filter((val) => !val.destroy);
function cleanupObjects() {
  state.projectiles = whereNotDestroyed(state.projectiles);
  state.enemies.forEach((enemy) => (enemy.row = whereNotDestroyed(enemy.row)));
  state.enemies = whereNotDestroyed(state.enemies);
  state.shields.forEach((shield) => {
    shield.parts = whereNotDestroyed(shield.parts);
  });
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.won === 0) {
    handleObjects();
    cleanupObjects();
    handleGameState();
  } else if (state.won === -1) {
    handleLossScreen();
  } else handleWinScreen();
  state.frame++;
  requestAnimationFrame(animate);
})();