ig.Game.inject({
  loadLevel: function (data) {
    this.parent(data);
    ig.debug.panels.maps.load(this);
  },
});

class MapsDebugPanel extends DebugPanel {
  maps = [];
  mapScreens = [];

  constructor(name, label) {
    this.parent(name, label);
    this.load();
  }

  load(game) {
    this.options = [];
    this.panels = [];

    if (!game || !game.backgroundMaps.length) {
      this.container.innerHTML = "<em>No Maps Loaded</em>";
      return;
    }

    this.maps = game.backgroundMaps;
    this.mapScreens = [];
    this.container.innerHTML = "";

    for (let i = 0; i < this.maps.length; i++) {
      const map = this.maps[i];
      const subPanel = new DebugPanel(i, `Layer ${i}`);
      const head = document.createElement("strong");

      head.textContent = `${i}: ${map.tiles.path}`;
      subPanel.container.appendChild(head);
      subPanel.addOption(new DebugOption("Enabled", map, "enabled"));
      subPanel.addOption(new DebugOption("Pre Rendered", map, "preRender"));
      subPanel.addOption(new DebugOption("Show Chunks", map, "debugChunks"));

      this.generateMiniMap(subPanel, map, i);
      this.addPanel(subPanel);
    }
  }

  generateMiniMap(panel, map, id) {
    const scale = ig.system.scale; // we'll need this a lot

    // resize the tileset, so that one tile is 'scale' pixels wide and high
    const tsC = document.createElement("canvas");
    const tsCtx = tsC.getContext("2d");

    const w = map.tiles.width * scale;
    const h = map.tiles.height * scale;
    const ws = w / map.tilesize;
    const hs = h / map.tilesize;
    tsC.width = ws;
    tsC.height = hs;
    tsCtx.drawImage(map.tiles.data, 0, 0, w, h, 0, 0, ws, hs);

    // create the minimap canvas
    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = map.width * scale;
    mapCanvas.height = map.height * scale;
    const ctx = mapCanvas.getContext("2d");

    if (ig.game.clearColor) {
      ctx.fillStyle = ig.game.clearColor;
      ctx.fillRect(0, 0, w, h);
    }

    // draw the map
    let tile = 0;
    for (let x = 0; x < map.width; x++) {
      for (let y = 0; y < map.height; y++) {
        if ((tile = map.data[y][x])) {
          ctx.drawImage(
            tsC,
            Math.floor(((tile - 1) * scale) % ws),
            Math.floor(((tile - 1) * scale) / ws) * scale,
            scale,
            scale,
            x * scale,
            y * scale,
            scale,
            scale
          );
        }
      }
    }

    const mapContainer = document.createElement("div");
    mapContainer.className = "debug-map-container";
    mapContainer.style.width = map.width * scale + "px";
    mapContainer.style.height = map.height * scale + "px";

    const mapScreen = document.createElement("div");
    mapScreen.className = "debug-map-screen";
    mapScreen.style.width = (ig.system.width / map.tilesize) * scale - 2 + "px";
    mapScreen.style.height = (ig.system.height / map.tilesize) * scale - 2 + "px";
    this.mapScreens[id] = mapScreen;

    mapContainer.appendChild(mapCanvas);
    mapContainer.appendChild(mapScreen);
    panel.container.appendChild(mapContainer);
  }

  afterRun() {
    // Update the screen position DIV for each mini-map
    const scale = ig.system.scale;
    for (let i = 0; i < this.maps.length; i++) {
      const map = this.maps[i];
      const screen = this.mapScreens[i];

      // Quick sanity check
      if (!map || !screen) continue;

      let x = map.scroll.x / map.tilesize;
      let y = map.scroll.y / map.tilesize;
      if (map.repeat) {
        x %= map.width;
        y %= map.height;
      }

      screen.style.left = x * scale + "px";
      screen.style.top = y * scale + "px";
    }
  }
}

ig.debug.addPanel({
  type: ig.DebugMapsPanel,
  name: "maps",
  label: "Background Maps",
});
