export const levelEditorConfig = {
  project: {
    /** Takes an array of glob regexes which specify where to load entities from.
     *  Can be individual files or entire directories.
     *  @example 'entityFiles': ['lib/game/powerups/*.js', 'lib/game/entities/laser.js'] */
    entityFiles: ["games/snake/entities.js"],
    /** Default path for the level file selection box. */
    levelPath: "games/snake/level.js",
    /** True to prettify the JSON saved to file. */
    prettyPrint: true,
  },
  /** Default settings when creating new layers in level editor. */
  layerDefaults: {
    width: 10,
    height: 10,
    tilesize: 32,
  },
  /** Whether to ask before closing level editor when there are unsaved changes. */
  askBeforeClose: false,
  /** Whether to attempt to load the last opened level on startup. */
  loadLastLevel: true,
  /** Size of the "snap" grid when moving entities. */
  entityGrid: 4,
  /** Number of undo levels. */
  undoLevels: 50,
  /**  Mouse and Key bindings in the level editor. Some function are bound to several keys. */
  binds: {
    MOUSE1: "draw",
    MOUSE2: "drag",
    SHIFT: "select",
    CTRL: "drag",
    SPACE: "menu",
    DELETE: "delete",
    BACKSPACE: "delete",
    G: "grid",
    C: "clone",
    Z: "undo",
    Y: "redo",
    MWHEEL_UP: "zoomin",
    PLUS: "zoomin",
    MWHEEL_DOWN: "zoomout",
    MINUS: "zoomout",
  },
  /** Whether to enable unidirectional scrolling for touchpads; this automatically unbinds the
   *  MWHEEL_UP and MWHEEL_DOWN actions. */
  touchScroll: false,
  /** View settings. Controls the default Zoom level and whether to show the grid on startup. */
  view: {
    zoom: 1,
    zoomMax: 4,
    zoomMin: 0.125,
    grid: false,
  },
  /** Font face and size for entity labels and the grid coordinates. */
  labels: {
    draw: true,
    step: 32,
    font: "10px Bitstream Vera Sans Mono, Monaco, sans-serif",
  },
  /** Colors to use for the background, selection boxes, text and the grid. */
  colors: {
    clear: "#000000", // Background Color
    highlight: "#ceff36", // Currently selected tile or entity
    primary: "#ffffff", // Labels and layer bounds
    secondary: "#555555", // Grid and tile selection bounds
    selection: "#ff9933", // Selection cursor box on tile maps
  },
  /** Settings for the Collision tiles. Shouldn't need to change these.
   *  The tilesize only specifies the size in the image - resizing to final
   *  size for each layer happens in level editor. */
  collisionTiles: {
    path: "assets/images/level-editor/collisiontiles-64.png",
    tilesize: 64,
  },
};
