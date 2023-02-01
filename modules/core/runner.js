import { System } from "./system.js";
import { SoundManager } from "./sound.js";
import { MediaFactory } from "./media-factory.js";
import { GameLoop } from "./loop.js";
import { GameLoader } from "./loader.js";
import { Entity } from "./entity.js";

export class GameRunner {
  customGameOptions = null;
  debugSystem = null;
  fonts = {};
  game = null;
  loader = null;
  loop = null;
  newGameClass = null; // TODO: link up to run() in loop
  mediaFactory = null;
  ready = false;
  soundManager = null;
  system = null;

  constructor({
    canvasId,
    gameClass,
    fps,
    width,
    height,
    scale,
    loaderClass,
    debugMode,
    showStats,
    fonts,
    ...customGameOptions
  } = {}) {
    this.customGameOptions = customGameOptions;
    this.system = new System({ runner: this, canvasId, width, height, scale, fps });
    this.soundManager = new SoundManager(this);
    this.mediaFactory = new MediaFactory({
      system: this.system,
      soundManager: this.soundManager,
    });
    this.loop = new GameLoop({ runner: this, showStats, targetFps: fps });

    // TODO - handle cases of no fonts being specified i.e fallback to a font that's always available.
    Object.keys(fonts).forEach((fontName) => {
      this.fonts[fontName] = this.mediaFactory.createFont({
        name: fontName,
        path: fonts[fontName],
      });
    });

    this.ready = true;
    loaderClass ??= GameLoader;
    this.loader = new loaderClass({
      runner: this,
      gameClass,
      debugMode,
    });
    this.loader.load();
  }

  setGame(gameClass) {
    if (this.running) this.newGameClass = gameClass;
    else this.setGameNow(gameClass);
  }

  setGameNow(gameClass) {
    this.game = new gameClass({
      system: this.system,
      fonts: this.fonts,
      mediaFactory: this.mediaFactory,
      ...this.customGameOptions,
    });
    this.loop.start();
  }

  launchDebugger() {
    console.debug("GameDebugger: Loading...");
    import("../debug/debug.js").then(({ GameDebugger }) => {
      this.gameDebugger = new GameDebugger({
        baseEntityClass: Entity,
        game: this.game,
        gameLoop: this.loop,
        system: this.system,
      });
    });
  }
}
