Entity.inject({
  colors: {
    names: "#fff",
    velocities: "#0f0",
    boxes: "#f00",
  },

  draw: function () {
    this.parent();

    const { ctx, drawPosition, scale } = this.system; // TODO
    // Collision Boxes
    if (Entity._debugShowBoxes) {
      ctx.strokeStyle = this.colors.boxes;
      ctx.lineWidth = 1.0;
      ctx.strokeRect(
        drawPosition(this.pos.x.round() - ig.game.screen.x) - 0.5,
        drawPosition(this.pos.y.round() - ig.game.screen.y) - 0.5,
        this.size.x * scale,
        this.size.y * scale
      );
    }

    // Velocities
    if (Entity._debugShowVelocities) {
      const x = this.pos.x + this.size.x / 2;
      const y = this.pos.y + this.size.y / 2;
      this._debugDrawLine(this.colors.velocities, x, y, x + this.vel.x, y + this.vel.y);
    }

    // Names & Targets
    if (Entity._debugShowNames) {
      if (this.name) {
        ctx.fillStyle = this.colors.names;
        ctx.fillText(
          this.name,
          drawPosition(this.pos.x - ig.game.screen.x),
          drawPosition(this.pos.y - ig.game.screen.y)
        );
      }

      if (typeof this.target === "object") {
        for (let t in this.target) {
          const ent = ig.game.getEntityByName(this.target[t]);
          if (!ent) continue;
          this._debugDrawLine(
            this.colors.names,
            this.pos.x + this.size.x / 2,
            this.pos.y + this.size.y / 2,
            ent.pos.x + ent.size.x / 2,
            ent.pos.y + ent.size.y / 2
          );
        }
      }
    }
  },

  _debugDrawLine: function (color, sx, sy, dx, dy) {
    const { ctx, drawPosition } = this.system;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(drawPosition(sx - ig.game.screen.x), drawPosition(sy - ig.game.screen.y));
    ctx.lineTo(drawPosition(dx - ig.game.screen.x), drawPosition(dy - ig.game.screen.y));
    ctx.stroke();
    ctx.closePath();
  },
});

ig.Entity._debugEnableChecks = true;
ig.Entity._debugShowBoxes = false;
ig.Entity._debugShowVelocities = false;
ig.Entity._debugShowNames = false;

ig.Entity.oldCheckPair = ig.Entity.checkPair;
ig.Entity.checkPair = function (a, b) {
  if (!ig.Entity._debugEnableChecks) return;
  ig.Entity.oldCheckPair(a, b);
};
