const levelEditorConfig = {
  project: {
    // The prefix path of your game's source code.
    modulePath: "lib/",

    /** Takes an array of glob regexes which specify where to load entities from.
     *  Can be individual files or entire directories.
     *  @example 'entityFiles': ['lib/game/powerups/*.js', 'lib/game/entities/laser.js'] */
    entityFiles: ["src/entities/*.js"],

    // The default path for the level file selection box
    levelPath: "assets/levels/",

    // Whether to pretty print the JSON data in level files. If you have
    // any issues with your levels, it's usually a good idea to turn this
    // on and look at the saved level files with a text editor.
    prettyPrint: true,
  },

  // Plugins for level editor: an array of module names to load
  plugins: [],

  // Default settings when creating new layers in level editor.
  layerDefaults: {
    width: 30,
    height: 20,
    tilesize: 8,
  },

  // Whether to ask before closing level editor when there are unsaved changes
  askBeforeClose: true,

  // Whether to attempt to load the last opened level on startup
  loadLastLevel: true,

  // Size of the "snap" grid when moving entities
  entityGrid: 4,

  // Number of undo levels.
  undoLevels: 50,

  // Mouse and Key bindings in the level editor. Some function are bound to
  // several keys.
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

  // Whether to enable unidirectional scrolling for touchpads; this
  // automatically unbinds the MWHEEL_UP and MWHEEL_DOWN actions.
  touchScroll: false,

  // View settings. You can change the default Zoom level and whether
  // to show the grid on startup here.
  view: {
    zoom: 1,
    zoomMax: 4,
    zoomMin: 0.125,
    grid: false,
  },

  // Font face and size for entity labels and the grid coordinates
  labels: {
    draw: true,
    step: 32,
    font: "10px Bitstream Vera Sans Mono, Monaco, sans-serif",
  },

  // Colors to use for the background, selection boxes, text and the grid
  colors: {
    clear: "#000000", // Background Color
    highlight: "#ceff36", // Currently selected tile or entity
    primary: "#ffffff", // Labels and layer bounds
    secondary: "#555555", // Grid and tile selection bounds
    selection: "#ff9933", // Selection cursor box on tile maps
  },

  // Settings for the Collision tiles. You shouldn't need to change these.
  // The tilesize only specifies the size in the image - resizing to final
  // size for each layer happens in level editor.
  collisionTiles: {
    path: "lib/weltmeister/collisiontiles-64.png",
    tilesize: 64,
  },

  // API paths for saving levels and browsing directories.
  api: {
    save: "api/save.php",
    browse: "api/browse.php",
    glob: "api/glob.php",
  },
};
