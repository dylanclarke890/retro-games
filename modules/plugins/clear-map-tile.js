export const ClearMapTilesPlugin = [
  {
    name: "clearTileAt",
    value: function ({ x, y }) {
      this.data[y][x] = 0;
      /* non prerendered maps automatically clear a tile visually next time they paint */
      if (!this.preRender) return;

      const scale = this.system.scale;
      const px = x * this.tilesize * scale;
      const py = y * this.tilesize * scale;

      const chunkXi = (px / this.chunkSize) | 0;
      const chunkYi = (py / this.chunkSize) | 0;

      const chunkPixelX = px % this.chunkSize;
      const chunkPixelY = py % this.chunkSize;

      const chunk = this.preRenderedChunks[chunkYi][chunkXi];
      const context = chunk.getContext("2d");
      context.clearRect(chunkPixelX, chunkPixelY, this.tilesize * scale, this.tilesize * scale);
    },
  },
  {
    name: "clearTilesAt",
    value: function (...positions) {
      for (let i = 0; i < positions.length; i++) this.clearTileAt(positions[i]);
    },
  },
];
