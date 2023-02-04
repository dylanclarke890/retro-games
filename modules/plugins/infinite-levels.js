import { BackgroundMap } from "../core/map.js";
import { Guard } from "../lib/guard.js";

export class InfiniteLevel {
  levels = null;
  options = {
    start: null,
    checkX: true,
    checkY: true,
    nextLevelFunc: null,
  };

  constructor(game, levels, options) {
    Guard.againstNull({ game });
    Guard.againstNull({ levels });

    this.game = game;
    this.levels = levels;

    if (options) {
      // check if the user passed in the start level as the second param
      if (options.entities && options.layer) this.options.start = options;
      else {
        this.options.start = options.start;
        if (options.checkX === true || options.checkX === false)
          this.options.checkX = options.checkX;
        if (options.checkY === true || options.checkY === false)
          this.options.checkY = options.checkY;
        this.options.nextLevelFunc =
          typeof options.nextLevelFunc === "function"
            ? options.nextLevelFunc
            : (numLevels) => Math.floor(Math.random() * numLevels);
      }
    }

    const allLevels = this.options.start ? allLevels.concat([this.options.start]) : this.levels;

    // get all layer names
    const layerNames = [];
    for (let i = 0; i < allLevels.length; i++) {
      const level = allLevels[i];
      for (let j = 0; j < level.layer.length; j++) {
        const layer = level.layer[j];
        if (layerNames.indexOf(layer.name) === -1) layerNames.push(layer.name);
      }
    }

    // copy level data to a new variable so the level is refreshed on restart
    const firstLevel = this.options.start || this.getNextLevel();
    const levelData = JSON.parse(JSON.stringify(firstLevel));
    this.game.loadLevel(levelData);

    for (let i = 0; i < layerNames.length; i++) {
      let map = this.getMap(layerNames[i]);
      if (map === false) {
        // make a new copy of thex map
        const existingMap = this.game.backgroundMaps[0],
          data = this.getEmptyMapData(existingMap.height, existingMap.width);

        const backgroundMap = new BackgroundMap({
          name: layerNames[i],
          tilesize: existingMap.tilesize,
          tileset: existingMap.tilesetName,
          distance: existingMap.distance,
          data,
          foreground: false,
          repeat: false,
          preRender: false,
          anims: {},
        });
        this.game.backgroundMaps.push(backgroundMap);
      }
    }

    this.game.collisionMap.name = "collision";
  }

  getMap(layerName) {
    if (layerName === "collision") return this.game.collisionMap;
    for (let i = 0; i < this.game.backgroundMaps.length; i++)
      if (layerName === this.game.backgroundMaps[i].name) return this.game.backgroundMaps[i];

    return false;
  }

  getEmptyMapData(height, width) {
    const data = [];
    // clear out the data
    for (let j = 0; j < height; j++) {
      const row = [];
      for (let k = 0; k < width; k++) {
        row.push(0);
      }
      data.push(row);
    }

    return data;
  }

  update() {
    // load a new set piece if necessary
    const firstMap = this.game.backgroundMaps[0];
    if (firstMap.width * firstMap.tilesize - this.game.screen.actual.x <= this.game.system.width) {
      const nextLevel = this.getNextLevel();
      // spawn entites
      for (let i = 0; i < nextLevel.entities.length; i++) {
        const { type, x, y, settings } = nextLevel.entities[i];
        this.game.spawnEntity(type, x + firstMap.width * firstMap.tilesize, y, settings);
      }

      // add the tiles to the level
      for (let i = 0; i < this.game.backgroundMaps.length; i++)
        this.extendMap(this.game.backgroundMaps[i], nextLevel);

      // if there is a collision map, add the collision map tiles
      if (this.game.collisionMap.data) this.extendMap(this.game.collisionMap, nextLevel);
    }

    // remove tiles that are no longer visible
    if (this.game.screen.actual.x >= firstMap.tilesize) {
      for (let i = 0; i < this.game.backgroundMaps.length; i++) {
        const data = this.game.backgroundMaps[i].data;
        for (let j = 0; j < data.length; j++) data[j].shift();
        this.game.backgroundMaps[i].width--;
      }

      // if there is a collisionMap remove the tiles that are no longer visible
      if (this.game.collisionMap.data) {
        for (let i = 0; i < this.game.collisionMap.data.length; i++)
          this.game.collisionMap.data[i].shift();

        this.game.collisionMap.width--;
      }

      for (let i = 0; i < this.game.entities.length; i++) {
        const entity = this.game.entities[i];
        entity.pos.x -= firstMap.tilesize;

        // remove entities that are no longer visible
        if (
          (this.options.checkX && entity.pos.x + entity.size.x - this.game.screen.actual.x < 0) ||
          (this.options.checkY &&
            entity.pos.y > this.game.screen.actual.y + this.game.system.height)
        ) {
          entity.kill();
        }
      }

      this.game.screen.actual.x -= firstMap.tilesize;
    }
  }

  getNextLevel() {
    return this.levels[this.options.nextLevelFunc(this.levels.length)];
  }

  extendMap(map, level) {
    let layer = this.getLayer(map.name, level);
    if (!layer) {
      layer = {
        data: this.getEmptyMapData(level.layer[0].data.length, level.layer[0].data[0].length),
        width: level.layer[0].data[0].length,
      };
    }

    const data = map.data;
    for (let j = 0; j < data.length; j++) data[j].push.apply(data[j], layer.data[j]);
    map.width += layer.width;
  }

  getLayer(layerName, level) {
    for (let i = 0; i < level.layer.length; i++)
      if (layerName === level.layer[i].name) return level.layer[i];
    return false;
  }
}
