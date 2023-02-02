import { plug } from "../lib/inject.js";
import { Timer } from "../lib/timer.js";
import { Input } from "../core/input.js";
import { uniqueId } from "../lib/string-utils.js";

// When the input stream gets this big, cut it down to the maximum size of the biggest combo.
const INPUT_STREAM_THRESHOLD = 100;
const actions = [];

/**
 * Intercept calls to ig.input.bind and ig.input.bindTouch so we know what actions to look for
 *  in the ComboManager.
 */
const inputOverrides = {
  bind(key, action) {
    actions.push(action);
    this.parent(key, action);
  },
  bindTouch(selector, action) {
    actions.push(action);
    this.parent(selector, action);
  },
};

plug(inputOverrides).into(Input);

export class ComboManager {
  constructor() {
    this.actions = actions;
    this.combos = {};
    this.timer = new Timer();
    this.inputStream = [];
    this.comboMaxSize = 2;

    // Invoke this method with the handle returned by add to de-register
    // a combo.
    this.remove = function (handle) {
      // Which combo are we removing?
      var combo = this.combos[handle];
      if (!combo) {
        // Invalid handle, early exit.
        return;
      }
      // Delete the combo itself.
      delete this.combos[handle];
    };

    // Meant to be called within context of ComboManager.
    // Pushes the action onto the input stream if the action
    // is currently pressed.
    var updateStreamIfPressed = function (action) {
      if (ig.input.pressed(action)) {
        this.inputStream.push({
          action: action,
          delta: this.timer.delta(),
        });
      }
      // Is the stream too big?
      if (this.inputStream.length > INPUT_STREAM_THRESHOLD) {
        this.inputStream = this.inputStream.slice(-this.comboMaxSize);
      }
    };

    // Meant to be called within context of ComboManager.
    // Checks the last n moves in the input stream to see if
    // they match the given combo. If they do, invoke the combo's
    // callback and reset the input stream so we don't get repeats.
    var checkCombo = function (combo) {
      var length = combo.moves.length;
      var slice = _.last(this.inputStream, length);
      // Early exit if not enough input yet.
      if (slice.length < length) {
        return;
      }
      var elapsedTime = slice[length - 1].delta - slice[0].delta;
      var joined = _.pluck(slice, "action").join("|");
      if (joined === combo.joinedMoves && elapsedTime <= combo.interval) {
        combo.callback();
        // Combo matched! Reset the input stream.
        this.inputStream = [];
      }
    };

    // Call this method every frame to check for combos!
    this.update = function () {
      // Iterate over the known actions, seeing if any were pressed.
      _.each(this.actions, updateStreamIfPressed, this);
      // Iterate over the combos checking to see if any hit.
      _.each(this.combos, checkCombo, this);
    };
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
    this.combos[handle] = {
      moves,
      interval,
      callback,
      joinedMoves: moves.join("|"),
    };
    this.comboMaxSize = Math.max(this.comboMaxSize, moves.length);
    // Return the handle for later removal.
    return handle;
  }
}
