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

const setMousePosition = (e) => {
  mouse.x = e.x - (canvasPosition.left + 6);
  mouse.y = e.y - canvasPosition.top;
};

canvas.addEventListener("mousemove", (e) => {
  setMousePosition(e);
  settings.actionButton.hover = isRectRectColliding(
    mouse,
    settings.actionButton
  );
});

window.addEventListener("resize", () => {
  canvasPosition = canvas.getBoundingClientRect();
});

canvas.addEventListener("click", (e) => {
  setMousePosition(e);
  switch (state.won) {
    case 0:
      const ready = [];
      const missileSpeed =
        settings.levels[currentRun.level].missileSpeed.player;
      for (let i = 0; i < state.cannons.length; i++) {
        const cannon = state.cannons[i];
        if (cannon.shotsLeft <= 0) continue;

        const missile = new Missile(
          cannon.x + cannon.w / 2,
          cannon.y,
          {
            x: mouse.x,
            y: mouse.y,
            ...settings.target, // h and w
          },
          missileSpeed
        );
        ready.push([cannon, missile]);
      }

      ready.sort((a, b) => a[1].framesTillHit - b[1].framesTillHit);

      const firing = ready[0];
      if (!firing) return;
      firing[0].shotsLeft--;
      state.missiles.push(firing[1]);
      break;
    case -1:
      if (!isRectRectColliding(mouse, settings.actionButton)) break;
      state = { ...defaultState() };
      currentRun = { level: 0, score: 0, buildings: [] };
      const y = canvas.height - 80;
      currentRun.buildings.push(
        new Building(135, y),
        new Building(210, y),
        new Building(285, y),
        new Building(460, y),
        new Building(535, y),
        new Building(610, y)
      );
      break;
    case 1:
      if (!isRectRectColliding(mouse, settings.actionButton)) break;
      nextLevel();
      break;
  }
});

class Cannon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = cannon.w;
    this.h = cannon.h;
    this.shotsLeft = 10;
  }

  update() {}

  draw() {
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    drawText(this.shotsLeft, "30px Arial", "white", this.x - 5, this.y + 70);
  }
}

class Missile {
  constructor(x, y, target, speed) {
    this.x = x;
    this.y = y;
    this.w = 10;
    this.h = 30;
    this.target = target;
    this.destroy = false;

    const distance = {
      x: target.x - x,
      y: target.y - y,
    };
    this.angle = Math.atan2(distance.y, distance.x);
    this.velocity = {
      x: Math.cos(this.angle) * speed,
      y: Math.sin(this.angle) * speed,
    };
    this.framesTillHit = Math.abs(Math.floor(distance.x / this.velocity.x));
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    if (this.framesTillHit-- <= 0) {
      this.destroy = true;
      state.explosions.push(new Explosion(this.x, this.y));
    }
  }

  draw() {
    drawText("x", "20px Arial", "red", this.target.x, this.target.y);
    const lineEnd = {
      x: this.x - this.velocity.x * 100,
      y: this.y - this.velocity.y * 100,
    };
    const grd = ctx.createLinearGradient(this.x, this.y, lineEnd.x, lineEnd.y);
    grd.addColorStop(0, "white");
    grd.addColorStop(1, "transparent");
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.stroke();
    ctx.closePath();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + 5 / Math.PI);
    ctx.fillStyle = "lightgreen";
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 0;
    this.rMax = settings.explosions.size.max;
    this.destroy = false;
    this.timer = 0;
    this.color = 0;
  }

  update() {
    if (this.timer++ % 3 === 0) {
      this.r = Math.min(this.r + 3, this.rMax);
      this.color++;
    }
    if (this.timer === 50) this.destroy = true;
    for (let i = 0; i < currentRun.buildings.length; i++) {
      const building = currentRun.buildings[i];
      if (isCircleRectColliding(this, building)) building.destroy = true;
    }
    for (let i = 0; i < state.missiles.length; i++) {
      const missile = state.missiles[i];
      if (isCircleRectColliding(this, missile)) missile.destroy = true;
    }
    for (let i = 0; i < state.cannons.length; i++) {
      const cannon = state.cannons[i];
      if (isCircleRectColliding(this, cannon)) cannon.destroy = true;
    }
    for (let i = 0; i < state.enemies.current.length; i++) {
      const enemy = state.enemies.current[i];
      if (isCircleRectColliding(this, enemy)) enemy.destroy = true;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = settings.explosions.colors[this.color % 3];
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}

class Building {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 50;
    this.destroy = false;
  }

  update() {}

  draw() {
    ctx.strokeStyle = "green";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}

const cannon = { w: 20, h: 20 };
const cannonIncline = { x: 15, y: 40 };
const hillW = 60;
const endsOffset = 30;
const gapsBetweenCannons =
  (canvas.width - (2 * endsOffset + 6 * cannonIncline.x + 3 * hillW)) / 2;
const cannonLocations = [];
cannonLocations[0] = endsOffset + cannonIncline.x + hillW / 2 - cannon.w / 2;
const cannonGap = hillW + gapsBetweenCannons + cannonIncline.x * 2;
cannonLocations[1] = cannonLocations[0] + cannonGap;
cannonLocations[2] = cannonLocations[1] + cannonGap;

let currentRun = {
  level: 0,
  score: 0,
  buildings: [],
};

const defaultState = () => ({
  cannons: [
    new Cannon(cannonLocations[0], canvas.height - 90),
    new Cannon(cannonLocations[1], canvas.height - 90),
    new Cannon(cannonLocations[2], canvas.height - 90),
  ],
  missiles: [],
  explosions: [],
  enemies: { current: [], total: 0 },
  frame: 0,
  won: 0, // -1 for loss, 0 for in progress, 1 for win
});

let state = { ...defaultState() };

const settings = {
  levels: [
    {
      missileSpeed: { player: 3, enemy: 0.5 },
      totalEnemies: 12,
      enemiesAtOnce: 3,
      spawnDelay: 100,
      scoreMultiplier: 1,
    },
    {
      missileSpeed: { player: 4, enemy: 1 },
      totalEnemies: 13,
      enemiesAtOnce: 4,
      spawnDelay: 90,
      scoreMultiplier: 2,
    },
    {
      missileSpeed: { player: 6, enemy: 1.5 },
      totalEnemies: 15,
      enemiesAtOnce: 5,
      spawnDelay: 75,
      scoreMultiplier: 3,
    },
    {
      missileSpeed: { player: 7, enemy: 2 },
      totalEnemies: 16,
      enemiesAtOnce: 6,
      spawnDelay: 70,
      scoreMultiplier: 4,
    },
    {
      missileSpeed: { player: 8, enemy: 2.25 },
      totalEnemies: 18,
      enemiesAtOnce: 7,
      spawnDelay: 65,
      scoreMultiplier: 5,
    },
    {
      missileSpeed: { player: 10, enemy: 3 },
      totalEnemies: 20,
      enemiesAtOnce: 8,
      spawnDelay: 55,
      scoreMultiplier: 6,
    },
    {
      missileSpeed: { player: 11, enemy: 3.5 },
      totalEnemies: 22,
      enemiesAtOnce: 8,
      spawnDelay: 45,
      scoreMultiplier: 7,
    },
    {
      missileSpeed: { player: 12, enemy: 4 },
      totalEnemies: 24,
      enemiesAtOnce: 10,
      spawnDelay: 40,
      scoreMultiplier: 8,
    },
    {
      missileSpeed: { player: 15, enemy: 6 },
      totalEnemies: 26,
      enemiesAtOnce: 12,
      spawnDelay: 35,
      scoreMultiplier: 9,
    },
    {
      missileSpeed: { player: 18, enemy: 10 },
      totalEnemies: 28,
      enemiesAtOnce: 14,
      spawnDelay: 30,
      scoreMultiplier: 10,
    },
  ],
  target: {
    w: 10,
    h: 10,
  },
  explosions: {
    size: {
      max: 30,
    },
    colors: ["purple", "red", "blue"],
  },
  actionButton: {
    w: 120,
    h: 40,
    x: canvas.width / 2 - 60,
    y: canvas.height / 2,
    font: "20px Arial",
    fontColor: "white",
    boxColor: "blue",
    hover: false,
    hoverColor: "lightblue",
  },
  points: {
    buildings: 100,
    ammo: 50,
  },
};

(function initialize() {
  const y = canvas.height - 80;
  currentRun.buildings.push(
    new Building(135, y),
    new Building(210, y),
    new Building(285, y),
    new Building(460, y),
    new Building(535, y),
    new Building(610, y)
  );
})();

function handleGameAreaSetup() {
  const { height, width } = canvas;
  drawText(
    `Score: ${currentRun.score}`,
    "30px Arial",
    "white",
    width / 2 - 150,
    50
  );

  drawText(
    `x${settings.levels[currentRun.level].scoreMultiplier}`,
    "30px Arial",
    "white",
    width / 2 + 150,
    50
  );
  ctx.strokeStyle = "limegreen";
  ctx.lineWidth = 2.5;
  const current = {
    y: height - 30,
    x: 0,
  };

  const connectPoint = () => ctx.lineTo(current.x, current.y);
  const strokeCannonHill = () => {
    current.x += cannonIncline.x;
    current.y -= cannonIncline.y;
    connectPoint();
    current.x += hillW;
    connectPoint();
    current.x += cannonIncline.x;
    current.y += cannonIncline.y;
    connectPoint();
  };

  ctx.beginPath();
  ctx.moveTo(current.x, current.y);
  current.x += endsOffset;
  connectPoint();
  strokeCannonHill();
  current.x += gapsBetweenCannons;
  connectPoint();
  strokeCannonHill();
  current.x += gapsBetweenCannons;
  connectPoint();
  strokeCannonHill();
  current.x += endsOffset;
  connectPoint();
  ctx.stroke();
  ctx.closePath();
}

function handleEnemyCreation() {
  const { enemiesAtOnce, totalEnemies, spawnDelay } =
    settings.levels[currentRun.level];
  const { current, total } = state.enemies;
  if (current.length === enemiesAtOnce || total === totalEnemies) return;
  if (state.frame > 0 && state.frame % spawnDelay === 0) {
    const x = randUpTo(canvas.width);
    const y = randUpTo(20) * -1;
    const targeted = [...state.cannons, ...currentRun.buildings][
      randUpTo(state.cannons.length + currentRun.buildings.length, true)
    ];
    const target = {
      x: targeted.x + targeted.w / 2 - 6,
      y: targeted.y + targeted.h,
      w: targeted.w,
      h: targeted.h,
    };
    const missile = new Missile(
      x,
      y,
      target,
      settings.levels[currentRun.level].missileSpeed.enemy
    );
    state.enemies.current.push(missile);
    state.enemies.total++;
  }
}

function handleObjectDrawing() {
  for (let i = 0; i < currentRun.buildings.length; i++) {
    currentRun.buildings[i].draw();
  }

  for (let i = 0; i < state.cannons.length; i++) {
    state.cannons[i].update();
    state.cannons[i].draw();
  }

  for (let i = 0; i < state.explosions.length; i++) {
    state.explosions[i].update();
    state.explosions[i].draw();
  }

  for (let i = 0; i < state.missiles.length; i++) {
    const missile = state.missiles[i];
    missile.update();
    missile.draw();
    if (missile.destroy)
      state.explosions.push(new Explosion(missile.x, missile.y));
  }

  for (let i = 0; i < state.enemies.current.length; i++) {
    const enemy = state.enemies.current[i];
    enemy.update();
    enemy.draw();
    if (enemy.destroy) {
      currentRun.score +=
        10 * settings.levels[currentRun.level].scoreMultiplier;
      state.explosions.push(new Explosion(enemy.x, enemy.y));
    }
  }
  handleGameAreaSetup();
}

const isNotDestroyed = (val) => !val.destroy;
function handleObjectCleanup() {
  state.missiles = state.missiles.filter(isNotDestroyed);
  state.cannons = state.cannons.filter(isNotDestroyed);
  state.explosions = state.explosions.filter(isNotDestroyed);
  state.enemies.current = state.enemies.current.filter(isNotDestroyed);
  currentRun.buildings = currentRun.buildings.filter(isNotDestroyed);
}

function checkForWin() {
  if (currentRun.buildings.length === 0) state.won = -1;
  else if (
    state.enemies.current.length === 0 &&
    state.enemies.total === settings.levels[currentRun.level].totalEnemies &&
    state.explosions.length === 0
  )
    state.won = 1;
}

function handleLossScreen() {
  drawText(
    "Game Over",
    "40px Arial",
    "white",
    canvas.width / 2 - 100,
    canvas.height / 2 - 150
  );
  drawText(
    `Score: ${currentRun.score}`,
    "20px Arial",
    "white",
    canvas.width / 2 - 100,
    canvas.height / 2 - 100
  );
  drawText(
    `Level: ${currentRun.level + 1}`,
    "20px Arial",
    "white",
    canvas.width / 2 + 100,
    canvas.height / 2 - 100
  );
  const { x, y, w, h, boxColor, font, fontColor, hover, hoverColor } =
    settings.actionButton;
  ctx.fillStyle = hover ? hoverColor : boxColor;
  ctx.fillRect(x, y, w, h);
  drawText("Play Again?", font, fontColor, x + 10, y + 30);
}

function handleWinScreen() {
  drawText(
    "Level Won",
    "40px Arial",
    "white",
    canvas.width / 2 - 100,
    canvas.height / 2 - 200
  );
  const scoreMultiplier = settings.levels[currentRun.level].scoreMultiplier;
  const { buildings, ammo } = settings.points;
  const ammoLeft = state.cannons.reduce(
    (sum, value) => sum + value.shotsLeft,
    0
  );
  const centerOffset = -100;
  drawText(
    "Bonus Score:",
    "30px Arial",
    "white",
    canvas.width / 2 + centerOffset,
    canvas.height / 2 - 150
  );
  drawText(
    `Ammo: ${ammoLeft} * ${scoreMultiplier * ammo}`,
    "20px Arial",
    "white",
    canvas.width / 2 + centerOffset,
    canvas.height / 2 - 100
  );
  drawText(
    `Buildings: ${currentRun.buildings.length} * ${
      scoreMultiplier * buildings
    }`,
    "20px Arial",
    "white",
    canvas.width / 2 + centerOffset,
    canvas.height / 2 - 50
  );

  const { x, y, w, h, boxColor, font, fontColor, hover, hoverColor } =
    settings.actionButton;
  ctx.fillStyle = hover ? hoverColor : boxColor;
  ctx.fillRect(x, y, w, h);
  drawText("Next Level", font, fontColor, x + 15, y + 30);
}

function nextLevel() {
  const scoreMultiplier = settings.levels[currentRun.level].scoreMultiplier;
  const { buildings, ammo } = settings.points;
  currentRun.score += currentRun.buildings.length * buildings * scoreMultiplier;
  for (let i = 0; i < state.cannons.length; i++)
    currentRun.score += state.cannons[i].shotsLeft * ammo * scoreMultiplier;
  currentRun.level++;
  state = { ...defaultState() };
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const winState = state.won;
  if (winState === -1) handleLossScreen();
  else if (winState === 1) handleWinScreen();
  else {
    handleEnemyCreation();
    handleObjectDrawing();
    handleObjectCleanup();
    checkForWin();
  }
  state.frame++;
  requestAnimationFrame(animate);
})();
