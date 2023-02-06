import { $new } from "../modules/lib/dom-utils.js";
import { plugin } from "../modules/lib/inject.js";

import { System } from "../modules/core/system.js";
import { GameImage } from "../modules/core/image.js";
import { SoundManager } from "../modules/core/sound.js";
import { MediaFactory } from "../modules/core/media-factory.js";

import { LevelEditorHttpClient } from "./http-client.js";
import { EventedInput } from "./evented-input.js";
import { LevelEditor, LevelEditorLoader } from "./level-editor.js";
import { levelEditorConfig } from "./config.js";

export class LevelEditorRunner {
  httpClient = null;
  config = null;
  game = null;
  input = null;
  loader = null;
  ready = false;
  soundManager = null;
  system = null;

  constructor() {
    this.httpClient = new LevelEditorHttpClient();
    this.config = levelEditorConfig;
    this.system = new System({
      runner: this,
      canvasId: "canvas",
      fps: 1,
      width: Math.floor(LevelEditor.getMaxWidth() / this.config.view.zoom),
      height: Math.floor(LevelEditor.getMaxHeight() / this.config.view.zoom),
      scale: this.config.view.zoom,
    });
    this.input = new EventedInput({ system: this.system });
    this.soundManager = new SoundManager(this);
    this.media = new MediaFactory({ system: this.system, soundManager: this.soundManager });
    this.injectImageOverrides();
    this.ready = true;

    this.loader = new LevelEditorLoader({
      httpClient: this.httpClient,
      config: this.config,
      debugMode: false,
      gameClass: LevelEditor,
      runner: this,
    });
    this.loader.load();
  }

  setGame(gameClass) {
    this.game = new gameClass({
      httpClient: this.httpClient,
      config: this.config,
      input: this.input,
      system: this.system,
      media: this.media,
    });
  }

  /** Image overrides for the LevelEditor. To make the zoom function work, we need to
   *  keep the original image, maintain a cache of scaled versions and use the default
   *  Canvas scaling (~bicubic) instead of nearest neighbor when zooming out. */
  injectImageOverrides() {
    const imageOverrides = {
      resize(scale) {
        if (!this.loaded) return;
        if (!this.scaleCache) this.scaleCache = {};
        if (this.scaleCache["x" + scale]) {
          this.data = this.scaleCache["x" + scale];
          return;
        }

        // Retain the original image when scaling
        if (!this.origData) this.origData = this.data;
        this.data = this.origData;

        // Nearest neighbor when zooming in
        if (scale > 1) this.base(scale);
        // Otherwise blur
        else {
          const scaled = $new("canvas");
          scaled.width = Math.ceil(this.width * scale);
          scaled.height = Math.ceil(this.height * scale);

          const scaledCtx = scaled.getContext("2d");
          scaledCtx.drawImage(
            this.data,
            0,
            0,
            this.width,
            this.height,
            0,
            0,
            scaled.width,
            scaled.height
          );
          this.data = scaled;
        }

        this.scaleCache["x" + scale] = this.data;
      },
    };
    plugin(imageOverrides).to(GameImage);
  }
}

new LevelEditorRunner();
