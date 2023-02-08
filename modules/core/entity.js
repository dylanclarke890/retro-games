import { constrain, toRad } from "../lib/number-utils.js";
import { Guard } from "../lib/guard.js";
import { Register } from "./register.js";
import { GameAnimation } from "./animation.js";

export class Entity {
  /** Collision Types - Determine if and how entities collide with each other.
   *
   * In ACTIVE vs. LITE or FIXED vs. ANY collisions, only the "weak" entity moves,
   * while the other one stays fixed. In ACTIVE vs. ACTIVE and ACTIVE vs. PASSIVE
   * collisions, both entities are moved. LITE or PASSIVE entities don't collide
   * with other LITE or PASSIVE entities at all. The behaviour for FIXED vs.
   * FIXED collisions is undefined.*/
  static COLLIDES = {
    NEVER: 0,
    LITE: 1,
    PASSIVE: 2,
    ACTIVE: 4,
    FIXED: 8,
  };
  static TYPE = {
    NONE: 0,
    A: 1,
    B: 2,
    BOTH: 3,
  };
  static #lastId = 0;

  id = 0;
  size = { x: 16, y: 16 };
  offset = { x: 0, y: 0 };
  pos = { x: 0, y: 0 };
  last = { x: 0, y: 0 };
  vel = { x: 0, y: 0 };
  accel = { x: 0, y: 0 };
  friction = { x: 0, y: 0 };
  maxVel = { x: 100, y: 100 };
  health = 10;
  zIndex = 0;
  gravityFactor = 1;
  standing = false;
  bounciness = 0;
  minBounceVelocity = 40;
  /** @type {Object.<string, GameAnimation>} */
  anims = {};
  /** @type {import("./animation.js").GameAnimationSheet} */
  animSheet = null;
  /** @type {GameAnimation} */
  currentAnim = null;
  /** @type {keyof Entity.TYPE} */
  type = Entity.TYPE.NONE;
  /** @type {keyof Entity.TYPE} */
  checkAgainst = Entity.TYPE.NONE;
  /** @type {keyof Entity.COLLIDES} */
  collides = Entity.COLLIDES.NEVER;
  slopeStanding = { min: toRad(44), max: toRad(136) };
  killed = false;
  /** @type {import("./game.js").Game} */
  game;

  get skipCollisionChecks() {
    return (
      this.type === Entity.TYPE.NONE &&
      this.checkAgainst === Entity.TYPE.NONE &&
      this.collides === Entity.COLLIDES.NEVER
    );
  }

  constructor({ x, y, game, settings }) {
    this.id = ++Entity.#lastId;
    Guard.againstNull({ game });
    this.game = game;
    this.pos.x = this.last.x = x;
    this.pos.y = this.last.y = y;
    Object.assign(this, settings);
  }

  reset(x, y, settings) {
    const proto = this.constructor.prototype;
    this.pos.x = x;
    this.pos.y = y;
    this.last.x = x;
    this.last.y = y;
    this.vel.x = proto.vel.x;
    this.vel.y = proto.vel.y;
    this.accel.x = proto.accel.x;
    this.accel.y = proto.accel.y;
    this.health = proto.health;
    this.standing = proto.standing;

    this.type = proto.type;
    this.checkAgainst = proto.checkAgainst;
    this.collides = proto.collides;
    Object.assign(this, settings);
  }

  createAnimationSheet(path, size = this.size) {
    this.animSheet = this.game.media.createAnimationSheet({ path, size });
  }

  addAnim(name, frameTime, sequence, stop) {
    if (!this.animSheet) throw new Error(`No animSheet to add the animation ${name} to.`);
    const animation = new GameAnimation(this.animSheet, frameTime, sequence, stop);
    this.anims[name] = animation;
    if (!this.currentAnim) this.currentAnim = animation;
    return animation;
  }

  update() {
    this.last.x = this.pos.x;
    this.last.y = this.pos.y;
    this.vel.y += this.game.gravity * this.game.system.tick * this.gravityFactor;

    this.vel.x = this.getNewVelocity(this.vel.x, this.accel.x, this.friction.x, this.maxVel.x);
    this.vel.y = this.getNewVelocity(this.vel.y, this.accel.y, this.friction.y, this.maxVel.y);

    // movement & collision
    const mx = this.vel.x * this.game.system.tick;
    const my = this.vel.y * this.game.system.tick;
    const res = this.game.collisionMap.trace(
      this.pos.x,
      this.pos.y,
      mx,
      my,
      this.size.x,
      this.size.y
    );
    this.handleMovementTrace(res);
    if (this.currentAnim) this.currentAnim.update();
  }

  getNewVelocity(vel, accel, friction, max) {
    if (accel) return constrain(vel + accel * this.game.system.tick, -max, max);
    else if (friction) {
      const delta = friction * this.game.system.tick;
      if (vel - delta > 0) return vel - delta;
      else if (vel + delta < 0) return vel + delta;
      else return 0;
    }
    return constrain(vel, -max, max);
  }

  /**
   * @param {MovementTrace} res
   */
  handleMovementTrace(res) {
    this.standing = false;
    if (res.collision.y) this.handleMapCollisionOnYAxis();
    if (res.collision.x) this.handleMapCollisionOnXAxis();
    if (res.collision.slope) this.handleMapCollisionOnSlope(res.collision.slope);
    this.pos = res.pos;
  }

  handleMapCollisionOnYAxis() {
    if (this.bounciness > 0 && Math.abs(this.vel.y) > this.minBounceVelocity)
      this.vel.y *= -this.bounciness;
    else {
      if (this.vel.y > 0) this.standing = true;
      this.vel.y = 0;
    }
  }

  handleMapCollisionOnXAxis() {
    if (this.bounciness > 0 && Math.abs(this.vel.x) > this.minBounceVelocity)
      this.vel.x *= -this.bounciness;
    else this.vel.x = 0;
  }

  handleMapCollisionOnSlope(slope) {
    if (this.bounciness > 0) {
      const proj = this.vel.x * slope.nx + this.vel.y * slope.ny;
      this.vel.x = (this.vel.x - slope.nx * proj * 2) * this.bounciness;
      this.vel.y = (this.vel.y - slope.ny * proj * 2) * this.bounciness;
    } else {
      const lengthSquared = slope.x * slope.x + slope.y * slope.y;
      const dot = (this.vel.x * slope.x + this.vel.y * slope.y) / lengthSquared;
      this.vel.x = slope.x * dot;
      this.vel.y = slope.y * dot;
      const angle = Math.atan2(slope.x, slope.y);
      if (angle > this.slopeStanding.min && angle < this.slopeStanding.max) this.standing = true;
    }
  }

  draw() {
    if (!this.currentAnim) return;
    const { x, y } = this.game.screen.rounded;
    this.currentAnim.draw(this.pos.x - this.offset.x - x, this.pos.y - this.offset.y - y);
  }

  kill() {
    this.game.removeEntity(this);
  }

  /**
   * @param {number} amount
   */
  receiveDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) this.kill();
  }

  /**
   * @param {Entity} other
   */
  touches(other) {
    return !(
      this.pos.x >= other.pos.x + other.size.x ||
      this.pos.x + this.size.x <= other.pos.x ||
      this.pos.y >= other.pos.y + other.size.y ||
      this.pos.y + this.size.y <= other.pos.y
    );
  }

  /**
   * @param {Entity} other
   */
  distanceTo(other) {
    const xd = this.pos.x + this.size.x / 2 - (other.pos.x + other.size.x / 2);
    const yd = this.pos.y + this.size.y / 2 - (other.pos.y + other.size.y / 2);
    return Math.sqrt(xd * xd + yd * yd);
  }

  /**
   * @param {Entity} other
   */
  angleTo(other) {
    return Math.atan2(
      other.pos.y + other.size.y / 2 - (this.pos.y + this.size.y / 2),
      other.pos.x + other.size.x / 2 - (this.pos.x + this.size.x / 2)
    );
  }

  /**
   * @param {Entity} other
   */
  checkWith(other) {
    // Do these entities want checks?
    if (this.checkAgainst & other.type) this.check(other);
    if (other.checkAgainst & this.type) other.check(this);
    // If this pair allows collision, solve it! At least one entity must
    // collide ACTIVE or FIXED, while the other one must not collide NEVER.
    if (this.collides && other.collides && this.collides + other.collides > Entity.COLLIDES.ACTIVE)
      this.solveCollision(this, other);
  }

  /**
   * @param {Entity} a
   * @param {Entity} b
   */
  solveCollision(a, b) {
    // If one entity is FIXED, or the other entity is LITE, the weak
    // (FIXED/NON-LITE) entity won't move in collision response
    let weak = null;
    if (a.collides === Entity.COLLIDES.LITE || b.collides === Entity.COLLIDES.FIXED) weak = a;
    else if (b.collides === Entity.COLLIDES.LITE || a.collides === Entity.COLLIDES.FIXED) weak = b;

    // Did they already overlap on the X-axis in the last frame? If so,
    // this must be a vertical collision!
    if (a.last.x + a.size.x > b.last.x && a.last.x < b.last.x + b.size.x) {
      // Which one is on top?
      if (a.last.y < b.last.y) this.separateOnYAxis(a, b, weak);
      else this.separateOnYAxis(b, a, weak);
      a.collideWith(b, "y");
      b.collideWith(a, "y");
    }
    // Horizontal collision
    else if (a.last.y + a.size.y > b.last.y && a.last.y < b.last.y + b.size.y) {
      // Which one is on the left?
      if (a.last.x < b.last.x) this.separateOnXAxis(a, b, weak);
      else this.separateOnXAxis(b, a, weak);
      a.collideWith(b, "x");
      b.collideWith(a, "x");
    }
  }

  /** FIXME/TODO - This is a mess. Instead of doing all the movements here, the entities
   * should get notified of the collision (with all details) and resolve it themselves. */
  separateOnXAxis(left, right, weak) {
    const nudge = left.pos.x + left.size.x - right.pos.x;
    // We have a weak entity, so just move this one
    if (weak) {
      const strong = left === weak ? right : left;
      weak.vel.x = -weak.vel.x * weak.bounciness + strong.vel.x;

      const resWeak = this.game.collisionMap.trace(
        weak.pos.x,
        weak.pos.y,
        weak === left ? -nudge : nudge,
        0,
        weak.size.x,
        weak.size.y
      );
      weak.pos.x = resWeak.pos.x;
    }

    // Normal collision - both move
    else {
      const v2 = (left.vel.x - right.vel.x) / 2;
      left.vel.x = -v2;
      right.vel.x = v2;

      const resLeft = this.game.collisionMap.trace(
        left.pos.x,
        left.pos.y,
        -nudge / 2,
        0,
        left.size.x,
        left.size.y
      );
      left.pos.x = Math.floor(resLeft.pos.x);

      const resRight = this.game.collisionMap.trace(
        right.pos.x,
        right.pos.y,
        nudge / 2,
        0,
        right.size.x,
        right.size.y
      );
      right.pos.x = Math.ceil(resRight.pos.x);
    }
  }

  separateOnYAxis(top, bottom, weak) {
    const nudge = top.pos.y + top.size.y - bottom.pos.y;

    // We have a weak entity, so just move this one
    if (weak) {
      const strong = top === weak ? bottom : top;
      weak.vel.y = -weak.vel.y * weak.bounciness + strong.vel.y;

      // Riding on a platform?
      let nudgeX = 0;
      if (weak === top && Math.abs(weak.vel.y - strong.vel.y) < weak.minBounceVelocity) {
        weak.standing = true;
        nudgeX = strong.vel.x * this.game.system.tick;
      }

      const resWeak = this.game.collisionMap.trace(
        weak.pos.x,
        weak.pos.y,
        nudgeX,
        weak === top ? -nudge : nudge,
        weak.size.x,
        weak.size.y
      );
      weak.pos.y = resWeak.pos.y;
      weak.pos.x = resWeak.pos.x;
    }

    // Bottom entity is standing - just bounce the top one
    else if (this.game.gravity && (bottom.standing || top.vel.y > 0)) {
      const resTop = this.game.collisionMap.trace(
        top.pos.x,
        top.pos.y,
        0,
        -(top.pos.y + top.size.y - bottom.pos.y),
        top.size.x,
        top.size.y
      );
      top.pos.y = resTop.pos.y;

      if (top.bounciness > 0 && top.vel.y > top.minBounceVelocity) top.vel.y *= -top.bounciness;
      else {
        top.standing = true;
        top.vel.y = 0;
      }
    }
    // Normal collision - both move
    else {
      const v2 = (top.vel.y - bottom.vel.y) / 2;
      top.vel.y = -v2;
      bottom.vel.y = v2;

      const nudgeX = bottom.vel.x * this.game.system.tick;
      const resTop = this.game.collisionMap.trace(
        top.pos.x,
        top.pos.y,
        nudgeX,
        -nudge / 2,
        top.size.x,
        top.size.y
      );
      top.pos.y = resTop.pos.y;

      const resBottom = this.game.collisionMap.trace(
        bottom.pos.x,
        bottom.pos.y,
        0,
        nudge / 2,
        bottom.size.x,
        bottom.size.y
      );
      bottom.pos.y = resBottom.pos.y;
    }
  }

  check() {}
  collideWith() {}
  ready() {}
  erase() {}
}

/**
 * @typedef {Object} CollisionState
 * @property {boolean} x
 * @property {boolean} y
 * @property {boolean} slope
 */

/**
 * @typedef {Object} Position2D
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} MovementTrace
 * @property {CollisionState} collision
 * @property {Position2D} pos
 * @property {Position2D} tile
 */

Register.entityType(Entity);
