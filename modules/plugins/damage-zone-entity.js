import { Entity } from "../core/entity.js";

export class EntityDamageZone extends Entity {
  _levelEditorDrawBox = true;
  _levelEditorBoxColor = "rgba(0, 0, 255, 0.7)";
  size = { x: 16, y: 16 };
  damage = 9999;
  ignoreknockback = "true";

  checkAgainst = Entity.TYPE.BOTH;
  collides = Entity.COLLIDES.ACTIVE;

  constructor({ x, y, game, settings }) {
    super({ x, y, game, settings });
    if (this.damage) this.ignoreknockback = this.stringToBoolean(this.ignoreknockback);
  }

  update() {}

  check(other) {
    other.receiveDamage(this.damage);
    if (!this.ignoreknockback) this.knockBack(other);
  }

  knockBack(other) {
    if (other.pos.x < this.pos.x) other.vel.x = -other.maxVel.x;
    else if (other.pos.x > this.pos.x) other.vel.x = other.maxVel.x;

    if (other.pos.y < this.pos.y) other.vel.y = -other.maxVel.y;
    else if (other.pos.y > this.pos.y) other.vel.y = other.maxVel.y;
  }

  stringToBoolean(string) {
    if (string == null) return false;
    switch (string.toLowerCase()) {
      case "true":
      case "yes":
      case "1":
        return true;
      case "false":
      case "no":
      case "0":
        return false;
      default:
        return Boolean(string);
    }
  }
}
