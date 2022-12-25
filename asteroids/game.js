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

const FPS = 60;
const settings = {
  fps: FPS,
  fpsInterval: 1000 / FPS,
  devMode: {
    showCenterDot: false,
    showCollisionBounding: false,
  },
  ship: {
    blinkDuration: 0.1, // duration of blink in seconds.
    explodeDuration: 0.3, // duration of explosion in seconds.
    invDuration: 3, // duration of invisibility in seconds.
    friction: 0.7, // friction coefficient of space (between 0 and 1 generally).
    thrust: 5,
    turnSpeed: 360, // degrees per second.
  },
  lasers: {
    speed: 500, // pixels per second
    maxAtOnce: 8,
    travelDistance: 0.6, // max travel distance in fractions of screen width
    explodeDuration: 0.1, // in seconds
  },
  asteroids: {
    startingNum: 3,
    speed: 50, // max starting speed of asteroids in pixels per second.
    size: 100,
    vert: 10,
    jag: 0.4, // jaggedness of the asteroids (0 - 1).
    points: {
      lg: 20,
      med: 50,
      sm: 100,
    },
  },
  text: {
    fadeTime: 2.5, // in seconds
    size: 40, // font size
  },
  livesPerGame: 3,
  storageKeys: {
    highScore: "highScore",
    muted: "muted",
  },
};

class Sound {
  constructor(src, maxStreams = 1, vol = 0.5) {
    this.streamNum = 0;
    this.streams = [];
    for (let i = 0; i < maxStreams; i++) {
      this.streams.push(new Audio(src));
      this.streams[i].volume = vol;
    }
  }

  play() {
    if (state.muted) return;
    this.streamNum = (this.streamNum + 1) % this.streams.length;
    this.streams[this.streamNum].play();
  }

  stop() {
    this.streams[this.streamNum].pause();
    this.streams[this.streamNum].currentTime = 0;
  }
}

class Music {
  constructor(srcLow, srcHigh) {
    this.soundLow = new Audio(srcLow);
    this.soundHigh = new Audio(srcHigh);
    this.soundLow.volume = 0.4;
    this.soundHigh.volume = 0.4;
    this.low = true;
    this.tempo = 1.0; // secs per beat
    this.beatTime = Math.ceil(this.tempo * settings.fps); // frames left until next beat
  }

  play() {
    if (this.low) this.soundLow.play();
    else this.soundHigh.play();
    this.low = !this.low;
  }

  tick() {
    if (this.beatTime === 0) {
      if (!state.muted) this.play();
      this.beatTime = Math.ceil(this.tempo * settings.fps);
    } else this.beatTime--;
  }

  setTempo(ratio) {
    this.tempo = 1 - 0.75 * (1.0 - ratio);
  }
}

const fx = {
  laser: new Sound("sounds/laser.m4a"),
  explode: new Sound("sounds/explode.m4a"),
  hit: new Sound("sounds/hit.m4a", 10),
  thrust: new Sound("sounds/thrust.m4a"),
};

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

class Laser {
  constructor(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.r = 5;
    this.travelled = 0;
    this.destroyed = false;
    this.explodeTime = 0;
  }

  draw() {
    if (this.explodeTime === 0) {
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "orangered";
      ctx.beginPath();
      ctx.arc(this.x, this.y, state.player.r * 0.75, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(this.x, this.y, state.player.r * 0.5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(this.x, this.y, state.player.r * 0.25, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  update() {
    if (this.explodeTime > 0) {
      this.explodeTime--;
      if (this.explodeTime === 0) this.destroyed = true;
      return;
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.travelled += Math.sqrt(
      Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2)
    );
    if (this.travelled > settings.lasers.travelDistance * canvas.width)
      this.destroyed = true;

    if (this.x < 0) this.x = canvas.width;
    else if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    else if (this.y > canvas.height) this.y = 0;

    for (let i = 0; i < state.asteroids.length; i++) {
      let x = state.asteroids[i].x;
      let y = state.asteroids[i].y;
      let r = state.asteroids[i].r;

      if (distanceBetweenPoints(this.x, this.y, x, y) < r) {
        state.asteroids[i].destroy();
        fx.hit.play();
        this.explodeTime = Math.ceil(
          settings.lasers.explodeDuration * settings.fps
        );
        break;
      }
    }
  }
}

function drawShip(x, y, a, r, color = "grey") {
  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  // nose of the ship
  ctx.moveTo(x + (4 / 3) * r * cosA, y - (4 / 3) * r * sinA);
  // rear left
  ctx.lineTo(x - r * ((2 / 3) * cosA + sinA), y + r * ((2 / 3) * sinA - cosA));
  // rear right
  ctx.lineTo(x - r * ((2 / 3) * cosA - sinA), y + r * ((2 / 3) * sinA + cosA));
  ctx.closePath();
  ctx.stroke();
}

class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.w = 40;
    this.r = this.w / 2;
    this.a = (180 / 180) * Math.PI;
    this.rot = 0;
    this.thrusting = false;
    this.thrust = {
      x: 0,
      y: 0,
    };
    this.explodeTime = 0;
    const { ship, fps } = settings;
    this.blinkNum = Math.ceil(ship.invDuration / ship.blinkDuration);
    this.blinkTime = Math.ceil(ship.blinkDuration * fps);
    this.canShoot = true;
    this.lasers = [];
    this.destroyed = false;
  }

  update() {
    const { fps, ship } = settings;
    const { thrust, friction } = ship;
    const exploding = this.explodeTime > 0;

    if (!exploding) {
      this.a += this.rot;
      if (this.thrusting) {
        this.thrust.x += (thrust * Math.cos(this.a)) / fps;
        this.thrust.y -= (thrust * Math.sin(this.a)) / fps;
        fx.thrust.play();
      } else {
        this.thrust.x -= (friction * this.thrust.x) / fps;
        this.thrust.y -= (friction * this.thrust.y) / fps;
        fx.thrust.stop();
      }
      this.x += this.thrust.x;
      this.y += this.thrust.y;

      if (this.blinkNum === 0) {
        for (let i = 0; i < state.asteroids.length; i++) {
          if (
            distanceBetweenPoints(
              this.x,
              this.y,
              state.asteroids[i].x,
              state.asteroids[i].y
            ) <
            this.r + state.asteroids[i].r
          ) {
            this.explode();
            state.asteroids[i].destroy();
            break;
          }
        }
      }
    } else {
      this.explodeTime--;
      if (this.explodeTime === 0) {
        state.lives--;
        if (state.lives === 0) {
          gameOver();
        } else this.reset();
      }
    }

    if (this.x < 0 - this.r) this.x = canvas.width + this.r;
    else if (this.x > canvas.width + this.r) this.x = 0 - this.r;
    if (this.y < 0 - this.r) this.y = canvas.height + this.r;
    else if (this.y > canvas.height + this.r) this.y = 0 - this.r;

    if (this.blinkNum > 0) {
      this.blinkTime--;

      if (this.blinkTime === 0) {
        this.blinkTime = Math.ceil(ship.blinkDuration * fps);
        this.blinkNum--;
      }
    }
  }

  draw() {
    const cosA = Math.cos(this.a);
    const sinA = Math.sin(this.a);

    const exploding = this.explodeTime > 0;
    if (exploding) {
      ctx.fillStyle = "darkred";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.7, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.4, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.1, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.8, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.5, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
      return;
    }

    const blinkOn = this.blinkNum % 2 === 0;
    if (this.thrusting && blinkOn) {
      ctx.fillStyle = "red";
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(
        // rear left
        this.x - this.r * ((2 / 3) * cosA + 0.5 * sinA),
        this.y + this.r * ((2 / 3) * sinA - 0.5 * cosA)
      );
      ctx.lineTo(
        // rear centre (behind the this)
        this.x - ((this.r * 5) / 3) * cosA,
        this.y + ((this.r * 5) / 3) * sinA
      );
      ctx.lineTo(
        // rear right
        this.x - this.r * ((2 / 3) * cosA - 0.5 * sinA),
        this.y + this.r * ((2 / 3) * sinA + 0.5 * cosA)
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (blinkOn) {
      drawShip(this.x, this.y, this.a, this.r);
    }

    const { showCenterDot, showCollisionBounding } = settings.devMode;
    if (showCenterDot) {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
    }

    if (showCollisionBounding) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.stroke();
    }
  }

  explode() {
    const { fps, ship } = settings;
    this.explodeTime = Math.ceil(ship.explodeDuration * fps);
    fx.explode.play();
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.w = 40;
    this.r = this.w / 2;
    this.a = (180 / 180) * Math.PI;
    this.rot = 0;
    this.thrusting = false;
    this.thrust = {
      x: 0,
      y: 0,
    };
    this.explodeTime = 0;
    const { ship, fps } = settings;
    this.blinkNum = Math.ceil(ship.invDuration / ship.blinkDuration);
    this.blinkTime = Math.ceil(ship.blinkDuration * fps);
    this.canShoot = true;
    this.lasers = [];
  }

  shootLaser() {
    const { maxAtOnce, speed } = settings.lasers;
    if (!this.canShoot || this.lasers.length >= maxAtOnce) return;
    const cosA = Math.cos(this.a);
    const sinA = Math.sin(this.a);
    this.lasers.push(
      new Laser(
        this.x + (4 / 3) * this.r * cosA,
        this.y - (4 / 3) * this.r * sinA,
        {
          x: (speed * cosA) / settings.fps,
          y: (-speed * sinA) / settings.fps,
        }
      )
    );
    this.canShoot = false;
    fx.laser.play();
  }
}

class Asteroid {
  constructor(x, y, r) {
    const { asteroids, fps } = settings;
    this.x = x;
    this.y = y;
    this.lvlMult = 1 + 0.1 * state.level;
    this.velocity = {
      x:
        ((Math.random() * asteroids.speed * this.lvlMult) / fps) *
        (Math.random() > 0.5 ? 1 : -1),
      y:
        ((Math.random() * asteroids.speed * this.lvlMult) / fps) *
        (Math.random() > 0.5 ? 1 : -1),
    };
    this.r = r;
    this.a = Math.random() * Math.PI * 2; // angle in radians
    this.vert = Math.floor(
      Math.random() * (asteroids.vert + 1) + asteroids.vert / 2
    );
    this.vertOffsets = [];
    for (let i = 0; i < this.vert; i++) {
      this.vertOffsets.push(
        Math.random() * asteroids.jag * 2 + 1 - asteroids.jag
      );
    }
    this.destroyed = false;
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    if (this.x < 0 - this.r) this.x = canvas.width + this.r;
    else if (this.x > canvas.width + this.r) this.x = 0 - this.r;
    if (this.y < 0 - this.r) this.y = canvas.height + this.r;
    else if (this.y > canvas.height + this.r) this.y = 0 - this.r;
  }

  draw() {
    ctx.closePath;
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = 3;
    // draw the path
    ctx.beginPath();
    ctx.moveTo(
      this.x + this.r * this.vertOffsets[0] * Math.cos(this.a),
      this.y + this.r * this.vertOffsets[0] * Math.sin(this.a)
    );
    // draw the polygon
    for (let j = 1; j < this.vert; j++) {
      ctx.lineTo(
        this.x +
          this.r *
            this.vertOffsets[j] *
            Math.cos(this.a + (j * Math.PI * 2) / this.vert),
        this.y +
          this.r *
            this.vertOffsets[j] *
            Math.sin(this.a + (j * Math.PI * 2) / this.vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    const { showCenterDot, showCollisionBounding } = settings.devMode;
    if (showCenterDot) {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
    }

    if (showCollisionBounding) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.stroke();
    }
  }

  destroy() {
    this.destroyed = true;
    const size = settings.asteroids.size;
    const { lg, med, sm } = settings.asteroids.points;
    if (this.r === Math.ceil(size / 2)) {
      state.asteroids.push(new Asteroid(this.x, this.y, size / 4));
      state.asteroids.push(new Asteroid(this.x, this.y, size / 4));
      state.score += lg;
    } else if (this.r === Math.ceil(size / 4)) {
      state.asteroids.push(new Asteroid(this.x, this.y, size / 8));
      state.asteroids.push(new Asteroid(this.x, this.y, size / 8));
      state.score += med;
    } else state.score += sm;
    checkForHighScore();
    state.asteroidsLeft--;
    state.music.setTempo(
      state.asteroidsLeft === 0 ? 1 : state.asteroidsLeft / state.totalAsteroids
    );
  }
}

let state;

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

function keyDown(/** @type {KeyboardEvent} */ ev) {
  const { ship, fps } = settings;
  switch (ev.code.toLowerCase()) {
    case "arrowleft":
      state.player.rot = ((ship.turnSpeed / 180) * Math.PI) / fps;
      break;
    case "arrowright":
      state.player.rot = ((-ship.turnSpeed / 180) * Math.PI) / fps;
      break;
    case "arrowup":
      state.player.thrusting = true;
      break;
    case "space":
      state.player.shootLaser();
      break;
    case "keym":
      state.muted = !state.muted;
      localStorage.setItem(settings.storageKeys.muted, state.muted);
      break;
    default:
      break;
  }
}
function keyUp(/** @type {KeyboardEvent} */ ev) {
  switch (ev.code.toLowerCase()) {
    case "arrowleft":
      state.player.rot = 0;
      break;
    case "arrowright":
      state.player.rot = 0;
      break;
    case "arrowup":
      state.player.thrusting = false;
      break;
    case "space":
      state.player.canShoot = true;
      break;
    default:
      break;
  }
}

function createAsteroidBelt() {
  const { startingNum, size } = settings.asteroids;
  state.totalAsteroids = (startingNum + state.level) * 7;
  state.asteroidsLeft = state.totalAsteroids;
  let x, y;
  for (let i = 0; i < startingNum + state.level; i++) {
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (
      distanceBetweenPoints(state.player.x, state.player.y, x, y) <
      size * 2 + state.player.r
    );
    state.asteroids.push(new Asteroid(x, y, Math.ceil(size / 2)));
  }
}

function distanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function newGame() {
  const high = localStorage.getItem(settings.storageKeys.highScore);
  const isMuted = localStorage.getItem(settings.storageKeys.muted);
  state = {
    player: new Player(),
    asteroids: [],
    level: 0,
    lives: settings.livesPerGame,
    text: "",
    textAlpha: 1.0,
    score: 0,
    highScore: high ? parseInt(high) : 0,
    muted: isMuted === "true",
    music: new Music("sounds/music-low.m4a", "sounds/music-high.m4a"),
    totalAsteroids: 0,
    asteroidsLeft: 0,
  };

  newLevel();
}

function handleObjects() {
  if (!state.player.destroyed) {
    state.player.update();
    state.player.draw();

    for (let i = 0; i < state.player.lasers.length; i++) {
      state.player.lasers[i].update();
      state.player.lasers[i].draw();
    }
  }

  for (let i = 0; i < state.asteroids.length; i++) {
    state.asteroids[i].update();
    state.asteroids[i].draw();
  }

  if (state.textAlpha > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(255, 255, 255, ${state.textAlpha})`;
    ctx.font = `small-caps ${settings.text.size}px dejavu sans mono`;
    ctx.fillText(state.text, canvas.width / 2, 100);
    state.textAlpha -= 1.0 / settings.text.fadeTime / settings.fps;
  } else if (state.player.destroyed) {
    newGame();
  }

  const livesPos = {
    x: 40,
    y: 40,
    a: (90 / 180) * Math.PI,
    r: 20,
  };

  for (let i = 0; i < state.lives; i++) {
    let lifeColour =
      state.player.explodeTime > 0 && i === state.lives - 1 ? "red" : "white";
    drawShip(livesPos.x, livesPos.y, livesPos.a, livesPos.r, lifeColour);
    livesPos.x += 50;
  }

  ctx.textAlign = "right";
  ctx.fillStyle = `white`;
  ctx.font = `${settings.text.size}px dejavu sans mono`;
  ctx.fillText(state.score, canvas.width - 20, 40);

  ctx.textAlign = "center";
  ctx.fillStyle = `white`;
  ctx.font = `${settings.text.size}px dejavu sans mono`;
  ctx.fillText(`High Score: ${state.highScore}`, canvas.width / 2, 40);

  state.music.tick();
}

function handleCleanup() {
  state.player.lasers = state.player.lasers.filter((val) => !val.destroyed);
  state.asteroids = state.asteroids.filter((val) => !val.destroyed);
}

function checkForLvlWin() {
  if (state.asteroids.length === 0) {
    state.level++;
    newLevel();
  }
}

function checkForHighScore() {
  if (state.highScore < state.score) {
    state.highScore = state.score;
    localStorage.setItem(settings.storageKeys.highScore, state.highScore);
  }
}

function newLevel() {
  createAsteroidBelt();
  state.text = `Level ${state.level + 1}`;
  state.textAlpha = 1.0;
}

function gameOver() {
  state.player.destroyed = true;
  state.text = "Game Over";
  state.textAlpha = 1.0;
}
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleObjects();
  handleCleanup();
  checkForLvlWin();
}

let stop = false,
  now,
  lastFrame;

(function startAnimating() {
  newGame();
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
