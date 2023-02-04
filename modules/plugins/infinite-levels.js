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
    for (var i = 0; i < ig.game.backgroundMaps.length; i++) {
      if (layerName === ig.game.backgroundMaps[i].name) {
        return ig.game.backgroundMaps[i];
      } else if (layerName === "collision") {
        return ig.game.collisionMap;
      }
    }

    return false;
  }

  getEmptyMapData(height, width) {
    var data = [];

    // clear out the data
    for (var j = 0; j < height; j++) {
      var row = [];
      for (var k = 0; k < width; k++) {
        row.push(0);
      }

      data.push(row);
    }

    return data;
  }

  update() {
    // load a new set piece if necessary
    if (
      ig.game.backgroundMaps[0].width * ig.game.backgroundMaps[0].tilesize - ig.game.screen.x <=
      ig.system.width
    ) {
      var nextLevel = this.getNextLevel();

      // spawn entites
      for (var i = 0; i < nextLevel.entities.length; i++) {
        var entity = nextLevel.entities[i];
        ig.game.spawnEntity(
          entity.type,
          entity.x + ig.game.backgroundMaps[0].width * ig.game.backgroundMaps[0].tilesize,
          entity.y,
          entity.settings
        );
      }

      // add the tiles to the level
      for (var i = 0; i < ig.game.backgroundMaps.length; i++) {
        this.extendMap(ig.game.backgroundMaps[i], nextLevel);
      }

      // if there is a collision map, add the collision map tiles
      if (ig.game.collisionMap.data) {
        this.extendMap(ig.game.collisionMap, nextLevel);
      }
    }

    // remove tiles that are no longer visible
    if (ig.game.screen.x >= ig.game.backgroundMaps[0].tilesize) {
      for (var i = 0; i < ig.game.backgroundMaps.length; i++) {
        var data = ig.game.backgroundMaps[i].data;
        for (var j = 0; j < data.length; j++) {
          data[j].shift();
        }

        ig.game.backgroundMaps[i].width--;
      }

      // if theere is a collisionMap remove the tiles that are no longer visible
      if (ig.game.collisionMap.data) {
        for (var i = 0; i < ig.game.collisionMap.data.length; i++) {
          ig.game.collisionMap.data[i].shift();
        }

        ig.game.collisionMap.width--;
      }

      for (var i = 0; i < ig.game.entities.length; i++) {
        ig.game.entities[i].pos.x -= ig.game.backgroundMaps[0].tilesize;
      }

      ig.game.screen.x -= ig.game.backgroundMaps[0].tilesize;
    }

    // remove entities that are no longer visible
    for (var i = 0; i < ig.game.entities.length; i++) {
      var entity = ig.game.entities[i];
      if (
        (this.options.checkX && entity.pos.x + entity.size.x - ig.game.screen.x < 0) ||
        (this.options.checkY && entity.pos.y > ig.game.screen.y + ig.system.height)
      ) {
        entity.kill();
      }
    }
  }

  getNextLevel() {
    return this.levels[this.options.nextLevelFunc(this.levels.length)];
  }

  extendMap(map, level) {
    var layer = this.getLayer(map.name, level);

    if (!layer) {
      layer = {
        data: this.getEmptyMapData(level.layer[0].data.length, level.layer[0].data[0].length),
        width: level.layer[0].data[0].length,
      };
    }

    var data = map.data;
    for (var j = 0; j < data.length; j++) {
      data[j].push.apply(data[j], layer.data[j]);
    }

    map.width += layer.width;
  }

  getLayer(layerName, level) {
    for (var i = 0; i < level.layer.length; i++) {
      if (layerName === level.layer[i].name) {
        return level.layer[i];
      }
    }

    return false;
  }
}
