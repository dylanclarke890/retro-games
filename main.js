import { GameRunner } from "./modules/core/runner.js";

new GameRunner({
  canvasId: "play-area",
  gameClass: PongGame,
  fps: 60,
  width: 768,
  height: 624,
  debugMode: false,
  fonts: {
    standard: "assets/fonts/arcade-classic.TTF",
    freedom: "assets/fonts/freedom.ttf",
  },
});
