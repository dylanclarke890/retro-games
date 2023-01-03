const levelOne = {
  entities: [
    { type: "EntityPaddleCpu", x: 100, y: 200, settings: {} },
    { type: "EntityPaddlePlayer", x: 500, y: 200, settings: {} },
    { type: "EntityBall", x: 400, y: 200, settings: {} },
  ],

  layer: [
    {
      name: "collision",
      repeat: false,
      distance: 1,
      tilesize: 48,
      foreground: false,
      data: [
        [1, 2, 6],
        [0, 3, 5],
        [2, 8, 1],
      ],
    },
    {
      name: "background1",
      tilesetName: "assets/images/block.png",
      repeat: false,
      distance: 1,
      tilesize: 48,
      foreground: false,
      data: [
        [1, 2, 6],
        [0, 3, 5],
        [2, 8, 1],
      ],
    },
  ],
};
