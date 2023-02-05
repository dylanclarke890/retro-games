ig.module("game.entities.damagezone")
  .requires("impact.entity")
  .defines(function () {
    EntityDamagezone = ig.Entity.extend({
      _wmDrawBox: true,
      _wmBoxColor: "rgba(0, 0, 255, 0.7)",
      size: { x: 16, y: 16 },
      damage: 9999,
      ignoreknockback: "true",

      checkAgainst: ig.Entity.TYPE.BOTH,
      collides: ig.Entity.COLLIDES.ACTIVE,

      init: function (x, y, settings) {
        this.parent(x, y, settings);
        if (settings.damage) {
          this.damage = settings.damage;
          this.ignoreknockback = this.stringToBoolean(settings.ignoreknockback);
        }
      },

      update: function () {},

      check: function (other) {
        if (other instanceof EntityPlayer) {
          other.receiveDamage(this.damage);

          if (!this.ignoreknockback) {
            this.knockBack(other);
          }
        }
      },

      knockBack: function (other) {
        if (other.pos.x < this.pos.x) {
          other.vel.x = -other.maxVel.x;
        } else if (other.pos.x > this.pos.x) {
          other.vel.x = other.maxVel.x;
        }

        if (other.pos.y < this.pos.y) {
          other.vel.y = -other.maxVel.y;
        } else if (other.pos.y > this.pos.y) {
          other.vel.y = other.maxVel.y;
        }
      },

      stringToBoolean: function (string) {
        if (string != null) {
          switch (string.toLowerCase()) {
            case "true":
            case "yes":
            case "1":
              return true;
            case "false":
            case "no":
            case "0":
              return false;
            default:
              return Boolean(string);
          }
        }
      },
    });
  });
