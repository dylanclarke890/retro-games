import { plugin } from "../lib/inject.js";
import { Timer } from "../lib/timer.js";
import { uniqueId } from "../lib/string-utils.js";
import { Guard } from "../lib/guard.js";

// When the input stream gets this big, cut it down to the maximum size of the biggest combo.
const INPUT_STREAM_THRESHOLD = 100;
const actions = [];

/**
 * Intercept calls to input.bind and input.bindTouch so we know what actions to look for
 * in the ComboManager.
 */
const inputOverrides = [
  {
    name: "bind",
    value: function (key, action) {
      actions.push(action);
      this.base(key, action);
    },
  },
  {
    name: "bindTouch",
    value: function (selector, action) {
      actions.push(action);
      this.base(selector, action);
    },
  },
];

export class ComboManager {
  constructor(input, opts) {
    Guard.againstNull({ input });
    plugin(inputOverrides).to(input);
    this.input = input;
    this.timer = new Timer();
    this.actions = actions;
    this.combos = {};
    this.inputStream = [];
    this.comboMaxSize = 2;

    Object.assign(this, opts ?? {});
  }

  /**
   * Register a combo with the combo manager. 'moves' is an array of inputs
   * that, pressed in succession, represent a combo. 'interval' is the time
   * in seconds that the player has to make the combo; for example, with an
   * interval of 1.5 the player has 1.5 seconds from the first keypress to
   * the last to complete the combo. 'callback' is invoked if the combo
   * completes successfully.
   * Returns a handle that you can use to remove a combo afterwards. */
  add(moves, interval, callback) {
    const handle = uniqueId("combo-manager-");
    // Register the combo itself.
    this.combos[handle] = { moves, interval, callback, joinedMoves: moves.join("|") };
    this.comboMaxSize = Math.max(this.comboMaxSize, moves.length);
    return handle;
  }

  /** Remove a combo. */
  remove(handle) {
    this.combos[handle] = null;
  }

  /** Pushes the action onto the input stream if the action is currently pressed. */
  updateStreamIfPressed(action) {
    if (this.input.pressed(action)) {
      this.inputStream.push({
        action: action,
        delta: this.timer.delta(),
      });
    }
    // Is the stream too big?
    if (this.inputStream.length > INPUT_STREAM_THRESHOLD)
      this.inputStream = this.inputStream.slice(-this.comboMaxSize);
  }

  /** Checks the last n moves in the input stream to see if they match the given
   *  combo. If they do, invoke the combo's callback and reset the input stream so
   *  we don't get repeats. */
  checkCombo(combo) {
    const comboLength = combo.moves.length;
    if (this.inputStream.length < comboLength) return; // Not enough input.
    const slice = this.inputStream.slice(-comboLength);
    const elapsedTime = slice[comboLength - 1].delta - slice[0].delta;
    const joined = slice
      .reduce((arr, current) => {
        arr.push(current.action);
        return arr;
      }, [])
      .join("|");
    if (joined === combo.joinedMoves && elapsedTime <= combo.interval) {
      combo.callback();
      this.inputStream = []; // Combo matched! Reset the input stream.
    }
  }

  /** Call this method every frame to check for combos! */
  update() {
    for (let i = 0; i < this.actions.length; i++) this.updateStreamIfPressed(this.actions[i]);
    const comboKeys = Object.keys(this.combos);
    for (let i = 0; i < comboKeys.length; i++) this.checkCombo(this.combos[comboKeys[i]]);
  }
}
