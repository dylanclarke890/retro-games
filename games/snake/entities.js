import { Register } from "../../modules/core/register.js";

export class Snake {}
export class PowerupBase {}
export class PowerupSpeedup {}
export class PowerupSlowdown {}

Register.entityTypes(Snake, PowerupSpeedup, PowerupSlowdown);
Register.preloadImages();
