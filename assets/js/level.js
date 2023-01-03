const levelOne = {
  entities: [
    { type: "EntityPaddleCpu", x: 100, y: 200, settings: {} },
    { type: "EntityPaddleCpu", x: 500, y: 200, settings: {} },
    { type: "EntityBall", x: 400, y: 200, settings: {} },
  ],

  layer: [
    {
      name: "background1",
      tilesetName: "media/tiles/biolab.png",
      repeat: false,
      distance: 1,
      tilesize: 8,
      foreground: false,
      data: [
        [1, 2, 6],
        [0, 3, 5],
        [2, 8, 1],
      ],
    },
  ],
};
