import { Entity } from "../core/entity.js";
import { Timer } from "../lib/timer.js";

export class EntityScreenShaker extends Entity {
  //damped harmonic oscillator about the origin 0,0.  follows the eqn:
  //   F = -kx - cv, or:
  //  a = -(kx + cv)/m
  // doesn't work if this exists in ig.game.entities array.  please use
  // new EntityScreenshaker() to create.
  gravityFactor = 0;
  pos = { x: 0, y: 0 };
  lastPos = { x: 0, y: 0 };
  maxVel = { x: 1000, y: 1000 };
  k = 150; //spring constant
  c = 10; //damping constant
  m = 1; //mass
  trap = 0.3;
  resetTime = 2.0;
  resetTimer = null;
  timedShakeTimer = null;
  timedShakeIntensity = 100;

  constructor({ game, settings }) {
    super({ x: 0, y: 0, game, settings });
  }

  update() {
    this.lastPos.x = this.pos.x;
    this.lastPos.y = this.pos.y;
    this.accel.x = (-this.k * this.pos.x + -this.c * this.vel.x) / this.m;
    this.accel.y = (-this.k * this.pos.y + -this.c * this.vel.y) / this.m;
    super.update();
    this.handleMovementTrace();
    if (this.resetTimer && this.resetTimer.delta() >= 0) {
      this.pos.x = 0;
      this.pos.y = 0;
      this.last.x = 0;
      this.last.y = 0;
      this.vel.x = 0;
      this.vel.y = 0;
      this.accel.x = 0;
      this.accel.y = 0;
      this.resetTimer = null;
    }
  }
  draw() {
    return; //do nothing.  invisible entity
  }

  handleMovementTrace() {
    this.pos.x += this.vel.x * this.game.system.tick;
    this.pos.y += this.vel.y * this.game.system.tick;
  }

  kill() {
    return; //do nothing.  invincible
  }

  applyImpulse(x, y) {
    this.vel.x -= x;
    this.vel.y -= y;
    if (this.resetTimer) this.resetTimer.reset();
    else this.resetTimer = new Timer(this.resetTime);
  }
}

export class ScreenShaker {
  spring = new EntityScreenShaker();

  update() {
    if (this.timedShakeTimer) {
      if (this.timedShakeTimer.delta() <= 0) {
        const randomAngle = Math.random(Math.PI * 2);
        this.applyImpulse(
          this.timedShakeIntensity * Math.cos(randomAngle),
          this.timedShakeIntensity * Math.sin(randomAngle)
        );
      } else this.timedShakeTimer = null; //time is up.
    }
    this.spring.update();
  }

  shakeScreen(screenPos) {
    screenPos.x = screenPos.x - this.spring.lastPos.x + this.spring.pos.x;
    screenPos.y = screenPos.y - this.spring.lastPos.y + this.spring.pos.y;
  }

  applyImpulse(x, y) {
    this.spring.applyImpulse(x, y);
  }

  timedShake(intensity, time) {
    this.timedShakeIntensity = intensity;
    this.timedShakeTimer = new Timer(time);
  }
}
