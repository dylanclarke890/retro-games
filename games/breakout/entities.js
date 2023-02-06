import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";
import { EventChain } from "../../modules/lib/event-chain.js";

export class Paddle extends Entity {
  constructor(opts) {
    super(opts);
  }
}

export class Brick extends Entity {
  constructor(opts) {
    super(opts);
  }
}

class PowerupBase extends Entity {
  constructor(opts) {
    super(opts);
    this.chain = new EventChain();
  }
}

export class MultiBallPowerup extends PowerupBase {}
export class SafetyNetPowerup extends PowerupBase {}
export class NoCollisionPowerup extends PowerupBase {}

Register.entityTypes(Paddle, Brick, MultiBallPowerup, SafetyNetPowerup, NoCollisionPowerup);
