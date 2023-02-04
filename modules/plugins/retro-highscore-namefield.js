import { Guard } from "../lib/guard.js";

import { Font } from "../core/font.js";
import { Input } from "../core/input.js";
import { Entity } from "../core/entity.js";
import { Register } from "../core/register.js";

/**
 * @example
 * this.retroNameField = this.spawnEntity(EntityRetroHighscoreNameField, 50, 100, {
 *   fontNormal: this.fonts.standard,
 *   fontHighlighted: this.fonts.freedom,
 *   numberOfChars: 3,
 *   letterSpacing: 20,
 * });
 */
export class RetroHighscoreNameField extends Entity {
  highlightedChar = 0;
  name = [];

  // List of symbols
  symbols = [
    "_",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  constructor({ x, y, game, settings }) {
    super({ x, y, game, settings });

    Guard.againstNull({ fontNormal: this.fontNormal });
    Guard.againstNull({ fontHighlighted: this.fontHighlighted });

    this.numberOfChars ??= 3;
    this.letterSpacing ??= 20;

    const input = this.game.input;
    // Bind keys to switch between characters
    input.bind(Input.KEY.LEFT_ARROW, "prev_char");
    input.bind(Input.KEY.RIGHT_ARROW, "next_char");

    // Bind keys to switch between symbols
    input.bind(Input.KEY.DOWN_ARROW, "prev_symbol");
    input.bind(Input.KEY.UP_ARROW, "next_symbol");

    // Init name character array
    this.name = [];
    for (let i = 0; i < this.numberOfChars; i++) {
      this.name.push({
        symbol: 1,
      });
    }
  }

  update() {
    // Switch between chars
    const input = this.game.input;
    if (input.pressed("prev_char") && this.highlightedChar > 0) this.highlightedChar--;
    else if (input.pressed("next_char") && this.highlightedChar < this.numberOfChars - 1)
      this.highlightedChar++;
    const current = this.highlightedChar;
    // Switch between symbols
    if (input.pressed("prev_symbol") && this.name[current].symbol > 0) this.name[current].symbol--;
    else if (input.pressed("next_symbol") && this.name[current].symbol < this.symbols.length - 1)
      this.name[current].symbol++;

    super.update();
  }
  draw() {
    // Draw each char
    for (let i = 0; i < this.numberOfChars; i++)
      this.drawCharacter(i, this.pos.x + this.letterSpacing * i, this.pos.y);
  }
  drawCharacter(index, x, y) {
    const symbol = this.symbols[this.name[index].symbol];
    // Draw a character highlighted or normal
    if (index === this.highlightedChar)
      this.fontHighlighted.write(symbol, x, y, { align: Font.ALIGN.CENTER });
    else this.fontNormal.write(symbol, x, y, { align: Font.ALIGN.CENTER });
  }

  getName() {
    let name = "";
    for (let i = 0; i < this.numberOfChars; i++) name += this.symbols[this.name[i].symbol];
    return name;
  }
}

Register.entityType(RetroHighscoreNameField);
