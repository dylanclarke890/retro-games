import { Game } from "../core/game.js";
import { EditMap } from "../level-editor/edit-map.js";
import { LevelEditor } from "../level-editor/level-editor.js";
import { plugin } from "../lib/inject.js";

export class MapMinifier {
  isEnabledForGame = false;
  isEnabledForLevelEditor = false;

  static enableForLevelEditor() {
    if (MapMinifier.isEnabledForLevelEditor) return;
    MapMinifier.isEnabledForLevelEditor = true;

    // TODO
    plugin({
      name: "loadResponse",
      value: function (data) {
        this.base(data);
      },
    }).to(LevelEditor);
    plugin({
      name: "getSaveData",
      value: function () {
        const layer = this.base();
        if (!layer.dataCompression) MapMinifier.compressLayer(layer);
        return layer;
      },
    }).to(EditMap);
  }

  compressLayer(layer) {
    const minifier = new MapMinifier();
    layer.dataCompressed = minifier.compress(layer);
    delete layer.data;
  }

  decompressLayer(layer) {
    if (!layer.dataCompressed) return;
    const minifier = new MapMinifier();
    minifier.decompress(layer);
    delete layer.dataCompressed;
  }

  enableForGame() {
    if (MapMinifier.isEnabledForGame) return;
    MapMinifier.isEnabledForGame = true;
    plugin({
      name: "loadLevel",
      value: function (level) {
        for (let i = 0; i < level.layer.length; i++) MapMinifier.decompressLayer(level.layer[i]);
        this.base(level);
      },
    }).to(Game);
  }

  compressedMap;
  compressedCellCount;
  compressedRow;

  compress(map) {
    const source = Object.assign({}, map.data);
    let lastRow = null;
    let rowCount = 0;
    this.compressedMap = "";

    for (let i = 0; i < source.length; i++) {
      const row = source[i];

      let lastValue = -1;
      let valueCount = 0;
      this.compressedCellCount = 0;
      this.compressedRow = "";

      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (cell === lastValue) {
          valueCount++;
          continue;
        }

        if (lastValue >= 0) this.addCompressedTiles(lastValue, valueCount);
        lastValue = cell;
        valueCount = 1;
      }

      this.addCompressedTiles(lastValue, valueCount);

      if (this.compressedRow === lastRow) {
        rowCount++;
        continue;
      }

      if (lastRow) this.addCompressedRows(lastRow, rowCount);
      lastRow = this.compressedRow;
      rowCount = 1;
    }

    this.addCompressedRows(lastRow, rowCount);

    return this.compressedMap;
  }

  decompress(map) {
    const source = map.dataCompressed;
    const compressedRows = source.split("/");
    const uncompressedData = [];

    for (let i = 0; i < compressedRows.length; i++) {
      const rowCount = parseInt(compressedRows[i]);
      const rowData = compressedRows[++i];
      const plainRowData = this.decompressRow(rowData);
      for (let j = 0; j < rowCount; j++) uncompressedData.push(plainRowData);
    }

    map.data = uncompressedData;
  }

  decompressRow(rowData) {
    const segments = rowData.split(",");
    const a = [];

    for (let s = 0; s < segments.length; s++) {
      const segment = segments[s];

      if (segment.indexOf("x") <= -1) {
        a.push(parseInt(segment));
        continue;
      }

      const xparts = segment.split("x");
      const tile = parseInt(xparts[0]);
      const count = parseInt(xparts[1]);

      for (let n = 0; n < count; n++) a.push(tile);
    }

    return a;
  }

  addCompressedTiles(tile, count) {
    if (this.compressedCellCount > 0) this.compressedRow += ",";
    this.compressedRow += tile.toString();
    if (count > 1) this.compressedRow += "x" + count.toString();
    this.compressedCellCount++;
  }

  addCompressedRows(rowData, count) {
    if (this.compressedMap.length > 0) this.compressedMap += "/";
    this.compressedMap += count.toString() + "/" + rowData;
  }
}
