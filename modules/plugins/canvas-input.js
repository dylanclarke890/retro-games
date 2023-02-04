// create a buffer that stores all inputs so that tabbing
// between them is made possible.
const inputs = [];
const noOp = () => {};
// initialize the Canvas Input
export class CanvasInput {
  #renderCanvas;
  #renderCtx;
  #shadowCanvas;
  #shadowCtx;
  #inputsIndex;

  constructor(opts) {
    //#region setup the defaults
    this._canvas = opts.canvas || null;
    this._ctx = this._canvas ? this._canvas.getContext("2d") : null;
    this._x = opts.x || 0;
    this._y = opts.y || 0;
    this._extraX = opts.extraX || 0;
    this._extraY = opts.extraY || 0;
    this._fontSize = opts.fontSize || 14;
    this._fontFamily = opts.fontFamily || "Arial";
    this._fontColor = opts.fontColor || "#000";
    this._placeHolderColor = opts.placeHolderColor || "#bfbebd";
    this._fontWeight = opts.fontWeight || "normal";
    this._fontStyle = opts.fontStyle || "normal";
    this._fontShadowColor = opts.fontShadowColor || "";
    this._fontShadowBlur = opts.fontShadowBlur || 0;
    this._fontShadowOffsetX = opts.fontShadowOffsetX || 0;
    this._fontShadowOffsetY = opts.fontShadowOffsetY || 0;
    this._readonly = opts.readonly || false;
    this._maxlength = opts.maxlength || null;
    this._width = opts.width || 150;
    this._height = opts.height || this._fontSize;
    this._padding = opts.padding >= 0 ? opts.padding : 5;
    this._borderWidth = opts.borderWidth >= 0 ? opts.borderWidth : 1;
    this._borderColor = opts.borderColor || "#959595";
    this._borderRadius = opts.borderRadius >= 0 ? opts.borderRadius : 3;
    this._backgroundImage = opts.backgroundImage || "";
    this._boxShadow = opts.boxShadow || "1px 1px 0px rgba(255, 255, 255, 1)";
    this._innerShadow = opts.innerShadow || "0px 0px 4px rgba(0, 0, 0, 0.4)";
    this._selectionColor = opts.selectionColor || "rgba(179, 212, 253, 0.8)";
    this._placeHolder = opts.placeHolder || "";
    this._value = (opts.value || this._placeHolder) + "";
    this._onsubmit = opts.onsubmit || noOp;
    this._onkeydown = opts.onkeydown || noOp;
    this._onkeyup = opts.onkeyup || noOp;
    this._onfocus = opts.onfocus || noOp;
    this._onblur = opts.onblur || noOp;
    this._cursor = false;
    this._cursorPos = 0;
    this._hasFocus = false;
    this._selection = [0, 0];
    this._wasOver = false;
    //#endregion setup the defaults

    this.boxShadow(this._boxShadow, true); // parse box shadow
    this.#calculateSize(); // calculate the full width and height with padding, borders and shadows

    this.#renderCanvas = document.createElement("canvas");
    this.#renderCanvas.setAttribute("width", this.outerW);
    this.#renderCanvas.setAttribute("height", this.outerH);
    this.#renderCtx = this.#renderCanvas.getContext("2d");

    this.#shadowCanvas = document.createElement("canvas");
    this.#shadowCanvas.setAttribute("width", this._width + this._padding * 2);
    this.#shadowCanvas.setAttribute("height", this._height + this._padding * 2);
    this.#shadowCtx = this.#shadowCanvas.getContext("2d");

    if (opts.backgroundGradient) {
      this._backgroundColor = this.#renderCtx.createLinearGradient(0, 0, 0, this.outerH);
      this._backgroundColor.addColorStop(0, opts.backgroundGradient[0]);
      this._backgroundColor.addColorStop(1, opts.backgroundGradient[1]);
    } else this._backgroundColor = opts.backgroundColor || "#fff";

    if (this._canvas) {
      this._canvas.addEventListener("mousemove", (e) => this.mousemove(e), false);
      this._canvas.addEventListener("mousedown", (e) => this.mousedown(e), false);
      this._canvas.addEventListener("mouseup", (e) => this.mouseup(e), false);
    }

    const autoBlur = () => {
      if (this._hasFocus && !this._mouseDown) this.blur();
    };
    window.addEventListener("mouseup", autoBlur, true);
    window.addEventListener("touchend", autoBlur, true);

    this._hiddenInput = document.createElement("input");
    this._hiddenInput.type = "text";
    this._hiddenInput.style.position = "absolute";
    this._hiddenInput.style.opacity = 0;
    this._hiddenInput.style.pointerEvents = "none";
    this._hiddenInput.style.zIndex = 0;
    this._hiddenInput.style.transform = "scale(0)"; // hide native blue text cursor on iOS
    this._updateHiddenInput();

    if (this._maxlength) this._hiddenInput.maxLength = this._maxlength;
    document.body.appendChild(this._hiddenInput);
    this._hiddenInput.value = this._value;

    this._hiddenInput.addEventListener("keydown", (e) => {
      if (!this._hasFocus) return;
      window.focus(); // hack to fix touch event bug in iOS Safari
      this._hiddenInput.focus();
      this.keydown(e); // continue with the keydown event
    });

    this._hiddenInput.addEventListener("keyup", (e) => {
      this._value = this._hiddenInput.value;
      this._cursorPos = this._hiddenInput.selectionStart;
      // update selection to hidden input's selection in case user did keyboard-based selection
      this._selection = [this._hiddenInput.selectionStart, this._hiddenInput.selectionEnd];
      this.render();
      if (this._hasFocus) this._onkeyup(e);
    });

    inputs.push(this); // add this to the buffer
    this.#inputsIndex = inputs.length - 1;

    this.render();
  }

  /**
   * Get/set the width of the text box.
   * @param {number} data Width in pixels.
   * @return {this | number} CanvasInput or current width.
   */
  width(data) {
    if (data == null) return this._width;
    this._width = data;
    this.#calculateSize();
    this._updateCanvasWH();
    this._updateHiddenInput();
    return this.render();
  }

  /**
   * Get/set the height of the text box.
   * @param {number} data Height in pixels.
   * @return {this | number} CanvasInput or current height.
   */
  height(data) {
    if (data == null) return this._height;
    this._height = data;
    this.#calculateSize();
    this._updateCanvasWH();
    this._updateHiddenInput();
    return this.render();
  }

  /**
   * Get/set the padding of the text box.
   * @param {number} data Padding in pixels.
   * @return {this | number} CanvasInput or current padding.
   */
  padding(data) {
    if (data == null) return this._padding;
    this._padding = data;
    this.#calculateSize();
    this._updateCanvasWH();
    return this.render();
  }

  /**
   * Get/set the background gradient.
   * @param {number} data Background gradient.
   * @return {this | number} CanvasInput or current background gradient.
   */
  backgroundGradient(data) {
    if (data == null) return this._backgroundColor;
    this._backgroundColor = this.#renderCtx.createLinearGradient(0, 0, 0, this.outerH);
    this._backgroundColor.addColorStop(0, data[0]);
    this._backgroundColor.addColorStop(1, data[1]);
    return this.render();
  }

  /**
   * Get/set the box shadow.
   * @param {string} data Box shadow in CSS format (1px 1px 1px rgba(0, 0, 0.5)).
   * @param {Boolean} doReturn (optional) True to prevent a premature render.
   * @return {this | string} CanvasInput or current box shadow.
   */
  boxShadow(data, doReturn) {
    if (data == null) return this._boxShadow;

    const boxShadow = data.split("px "); // parse box shadow
    this._boxShadow = {
      x: this._boxShadow === "none" ? 0 : parseInt(boxShadow[0], 10),
      y: this._boxShadow === "none" ? 0 : parseInt(boxShadow[1], 10),
      blur: this._boxShadow === "none" ? 0 : parseInt(boxShadow[2], 10),
      color: this._boxShadow === "none" ? "" : boxShadow[3],
    };

    // take into account the shadow and its direction
    if (this._boxShadow.x < 0) {
      this.shadowL = Math.abs(this._boxShadow.x) + this._boxShadow.blur;
      this.shadowR = this._boxShadow.blur + this._boxShadow.x;
    } else {
      this.shadowL = Math.abs(this._boxShadow.blur - this._boxShadow.x);
      this.shadowR = this._boxShadow.blur + this._boxShadow.x;
    }

    if (this._boxShadow.y < 0) {
      this.shadowT = Math.abs(this._boxShadow.y) + this._boxShadow.blur;
      this.shadowB = this._boxShadow.blur + this._boxShadow.y;
    } else {
      this.shadowT = Math.abs(this._boxShadow.blur - this._boxShadow.y);
      this.shadowB = this._boxShadow.blur + this._boxShadow.y;
    }

    this.shadowW = this.shadowL + this.shadowR;
    this.shadowH = this.shadowT + this.shadowB;

    this.#calculateSize();

    if (!doReturn) {
      this._updateCanvasWH();
      return this.render();
    }

    return this;
  }

  /**
   * Get/set the current text box value.
   * @param {string} data Text value.
   * @return {this | string} CanvasInput or current text value.
   */
  value(data) {
    if (data == null) return this._value === this._placeHolder ? "" : this._value;

    this._value = data + "";
    this._hiddenInput.value = data + "";
    this._cursorPos = this._clipText().length; // update the cursor position
    this.render();
    return this;
  }

  /**
   * Set or fire the onsubmit event.
   * @param {Function} fn Custom callback.
   */
  onsubmit(fn) {
    if (fn == null) this._onsubmit();
    this._onsubmit = fn;
    return this;
  }

  /**
   * Set or fire the onkeydown event.
   * @param {Function} fn Custom callback.
   */
  onkeydown(fn) {
    if (fn == null) this._onkeydown();
    this._onsubmit = fn;
    return this;
  }

  /**
   * Set or fire the onkeyup event.
   * @param {Function} fn Custom callback.
   */
  onkeyup(fn) {
    if (fn == null) this._onkeyup();
    this._onkeyup = fn;
    return this;
  }

  /**
   * Place focus on the CanvasInput box, placing the cursor
   * either at the end of the text or where the user clicked.
   * @param {number} pos (optional) The position to place the cursor.
   * @return {CanvasInput}
   */
  focus(pos) {
    // only fire the focus event when going from unfocussed
    if (!this._hasFocus) {
      this._onfocus(this);
      // remove focus from all other inputs
      for (let i = 0; i < inputs.length; i++) inputs[i].blur();
    }

    if (!this._selectionUpdated) this._selection = [0, 0]; // remove selection
    else delete this._selectionUpdated;

    // if this is readonly, don't allow it to get focus
    this._hasFocus = true;
    if (this._readonly) this._hiddenInput.readOnly = true;
    else {
      this._hiddenInput.readOnly = false;
      // update the cursor position
      this._cursorPos = typeof pos === "number" ? pos : this._clipText().length;

      // clear the place holder
      if (this._placeHolder === this._value) {
        this._value = "";
        this._hiddenInput.value = "";
      }

      this._cursor = true;

      // setup cursor interval
      if (this._cursorInterval) clearInterval(this._cursorInterval);
      this._cursorInterval = setInterval(() => {
        this._cursor = !this._cursor;
        this.render();
      }, 500);
    }

    // move the real focus to the hidden input
    const hasSelection = this._selection[0] > 0 || this._selection[1] > 0;
    this._hiddenInput.focus();
    this._hiddenInput.selectionStart = hasSelection ? this._selection[0] : this._cursorPos;
    this._hiddenInput.selectionEnd = hasSelection ? this._selection[1] : this._cursorPos;

    return this.render();
  }

  /**
   * Removes focus from the CanvasInput box.
   * @return {CanvasInput}
   */
  blur() {
    if (!this._hasFocus) return;
    this._onblur();
    if (this._cursorInterval) clearInterval(this._cursorInterval);
    this._hasFocus = false;
    this._cursor = false;
    this._selection = [0, 0];
    this._hiddenInput.blur();
    // fill the place holder
    if (this._value === "") this._value = this._placeHolder;
    return this.render();
  }

  /**
   * Fired with the keydown event to draw the typed characters.
   * @param {Event} e The keydown event.
   * @return {CanvasInput}
   */
  keydown(e) {
    const keyCode = e.which;
    // make sure the correct text field is being updated
    if (this._readonly || !this._hasFocus) return;
    // fire custom user event
    this._onkeydown(e);

    // add support for Ctrl/Cmd+A selection
    if (keyCode === 65 && (e.ctrlKey || e.metaKey)) {
      this.selectText();
      e.preventDefault();
      return this.render();
    }

    // block keys that shouldn't be processed
    if (keyCode === 17 || e.metaKey || e.ctrlKey) return this;

    if (keyCode === 13) {
      // enter key
      e.preventDefault();
      this._onsubmit(e);
    } else if (keyCode === 9) {
      // tab key
      e.preventDefault();
      if (inputs.length > 1) {
        const next = inputs[this.#inputsIndex + 1] ? this.#inputsIndex + 1 : 0;
        this.blur();
        setTimeout(() => {
          inputs[next].focus();
        }, 10);
      }
    }

    // update the canvas input state information from the hidden input
    this._value = this._hiddenInput.value;
    this._cursorPos = this._hiddenInput.selectionStart;
    this._selection = [0, 0];

    return this.render();
  }

  /**
   * Fired with the click event on the canvas, and puts focus on/off
   * based on where the user clicks.
   * @param {Event} e The click event.
   * @return {CanvasInput}
   */
  click(e) {
    const mouse = this._mousePos(e),
      x = mouse.x,
      y = mouse.y;

    if (this._endSelection) {
      delete this._endSelection;
      delete this._selectionUpdated;
      return;
    }

    if ((this._canvas && this._overInput(x, y)) || !this._canvas) {
      if (this._mouseDown) {
        this._mouseDown = false;
        this.click(e);
        return this.focus(this._clickPos(x, y));
      }
    } else return this.blur();
  }

  /**
   * Fired with the mousemove event to update the default cursor.
   * @param {Event} e The mousemove event.
   * @return {CanvasInput}
   */
  mousemove(e) {
    const mouse = this._mousePos(e),
      x = mouse.x,
      y = mouse.y,
      isOver = this._overInput(x, y);

    if (isOver && this._canvas) {
      this._canvas.style.cursor = "text";
      this._wasOver = true;
    } else if (this._wasOver && this._canvas) {
      this._canvas.style.cursor = "default";
      this._wasOver = false;
    }

    if (this._hasFocus && this._selectionStart >= 0) {
      const curPos = this._clickPos(x, y),
        start = Math.min(this._selectionStart, curPos),
        end = Math.max(this._selectionStart, curPos);

      if (!isOver) {
        this._selectionUpdated = true;
        this._endSelection = true;
        delete this._selectionStart;
        this.render();
        return;
      }

      if (this._selection[0] !== start || this._selection[1] !== end) {
        this._selection = [start, end];
        this.render();
      }
    }
  }

  /**
   * Fired with the mousedown event to start a selection drag.
   * @param {Event} e The mousedown event.
   */
  mousedown(e) {
    const mouse = this._mousePos(e),
      x = mouse.x,
      y = mouse.y,
      isOver = this._overInput(x, y);

    // setup the 'click' event
    this._mouseDown = isOver;
    // start the selection drag if inside the input
    if (this._hasFocus && isOver) this._selectionStart = this._clickPos(x, y);
  }

  /**
   * Fired with the mouseup event to end a selection drag.
   * @param {Event} e The mouseup event.
   */
  mouseup(e) {
    const mouse = this._mousePos(e),
      x = mouse.x,
      y = mouse.y;

    // update selection if a drag has happened
    const isSelection = this._clickPos(x, y) !== this._selectionStart;
    if (this._hasFocus && this._selectionStart >= 0 && this._overInput(x, y) && isSelection) {
      this._selectionUpdated = true;
      delete this._selectionStart;
      this.render();
    } else delete this._selectionStart;

    this.click(e);
  }

  /**
   * Select a range of text in the input.
   * @param {Array} range (optional) Leave blank to select all. Format: [start, end]
   * @return {CanvasInput}
   */
  selectText(range) {
    range = range || [0, this._value.length];

    // select the range of text specified (or all if none specified)
    setTimeout(() => {
      this._selection = [range[0], range[1]];
      this._hiddenInput.selectionStart = range[0];
      this._hiddenInput.selectionEnd = range[1];
      this.render();
    }, 1);

    return this;
  }

  /**
   * Helper method to get the off-DOM canvas.
   * @return {Object} Reference to the canvas.
   */
  renderCanvas() {
    return this.#renderCanvas;
  }

  /**
   * Clears and redraws the CanvasInput on an off-DOM canvas,
   * and if a main canvas is provided, draws it all onto that.
   * @return {CanvasInput}
   */
  render() {
    const ctx = this.#renderCtx,
      w = this.outerW,
      h = this.outerH,
      br = this._borderRadius,
      bw = this._borderWidth,
      sw = this.shadowW,
      sh = this.shadowH;

    if (!ctx) return;

    // clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // setup the box shadow
    ctx.shadowOffsetX = this._boxShadow.x;
    ctx.shadowOffsetY = this._boxShadow.y;
    ctx.shadowBlur = this._boxShadow.blur;
    ctx.shadowColor = this._boxShadow.color;

    // draw the border
    if (this._borderWidth > 0) {
      ctx.fillStyle = this._borderColor;
      this._roundedRect(ctx, this.shadowL, this.shadowT, w - sw, h - sh, br);
      ctx.fill();

      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
    }

    // draw the text box background
    this._drawTextBox(() => {
      // make sure all shadows are reset
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;

      // clip the text so that it fits within the box
      let text = this._clipText();

      // draw the selection
      const paddingBorder = this._padding + this._borderWidth + this.shadowT;
      if (this._selection[1] > 0) {
        const selectOffset = this._textWidth(text.substring(0, this._selection[0])),
          selectWidth = this._textWidth(text.substring(this._selection[0], this._selection[1]));
        ctx.fillStyle = this._selectionColor;
        ctx.fillRect(paddingBorder + selectOffset, paddingBorder, selectWidth, this._height);
      }

      // draw the cursor
      if (this._cursor) {
        const cursorOffset = this._textWidth(text.substring(0, this._cursorPos));
        ctx.fillStyle = this._fontColor;
        ctx.fillRect(paddingBorder + cursorOffset, paddingBorder, 1, this._height);
      }

      // draw the text
      const textX = this._padding + this._borderWidth + this.shadowL,
        textY = Math.round(paddingBorder + this._height / 2);

      // only remove the placeholder text if they have typed something
      text = text === "" && this._placeHolder ? this._placeHolder : text;

      ctx.fillStyle =
        this._value !== "" && this._value !== this._placeHolder
          ? this._fontColor
          : this._placeHolderColor;
      ctx.font =
        this._fontStyle + " " + this._fontWeight + " " + this._fontSize + "px " + this._fontFamily;
      ctx.shadowColor = this._fontShadowColor;
      ctx.shadowBlur = this._fontShadowBlur;
      ctx.shadowOffsetX = this._fontShadowOffsetX;
      ctx.shadowOffsetY = this._fontShadowOffsetY;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, textX, textY);

      // parse inner shadow
      const innerShadow = this._innerShadow.split("px "),
        isOffsetX = this._innerShadow === "none" ? 0 : parseInt(innerShadow[0], 10),
        isOffsetY = this._innerShadow === "none" ? 0 : parseInt(innerShadow[1], 10),
        isBlur = this._innerShadow === "none" ? 0 : parseInt(innerShadow[2], 10),
        isColor = this._innerShadow === "none" ? "" : innerShadow[3];

      // draw the inner-shadow (damn you canvas, this should be easier than this...)
      if (isBlur > 0) {
        const shadowCtx = this.#shadowCtx,
          scw = shadowCtx.canvas.width,
          sch = shadowCtx.canvas.height;

        shadowCtx.clearRect(0, 0, scw, sch);
        shadowCtx.shadowBlur = isBlur;
        shadowCtx.shadowColor = isColor;

        // top shadow
        shadowCtx.shadowOffsetX = 0;
        shadowCtx.shadowOffsetY = isOffsetY;
        shadowCtx.fillRect(-1 * w, -100, 3 * w, 100);

        // right shadow
        shadowCtx.shadowOffsetX = isOffsetX;
        shadowCtx.shadowOffsetY = 0;
        shadowCtx.fillRect(scw, -1 * h, 100, 3 * h);

        // bottom shadow
        shadowCtx.shadowOffsetX = 0;
        shadowCtx.shadowOffsetY = isOffsetY;
        shadowCtx.fillRect(-1 * w, sch, 3 * w, 100);

        // left shadow
        shadowCtx.shadowOffsetX = isOffsetX;
        shadowCtx.shadowOffsetY = 0;
        shadowCtx.fillRect(-100, -1 * h, 100, 3 * h);

        // create a clipping mask on the main canvas
        this._roundedRect(
          ctx,
          bw + this.shadowL,
          bw + this.shadowT,
          w - bw * 2 - sw,
          h - bw * 2 - sh,
          br
        );
        ctx.clip();

        // draw the inner-shadow from the off-DOM canvas
        ctx.drawImage(
          this._shadowCanvas,
          0,
          0,
          scw,
          sch,
          bw + this.shadowL,
          bw + this.shadowT,
          scw,
          sch
        );
      }

      // draw to the visible canvas
      if (this._ctx) {
        this._ctx.clearRect(this._x, this._y, ctx.canvas.width, ctx.canvas.height);
        this._ctx.drawImage(this._renderCanvas, this._x, this._y);
      }

      return this;
    });
  }

  /**
   * Destroy this input and stop rendering it.
   */
  destroy() {
    // pull from the inputs array
    const index = inputs.indexOf(this);
    if (index !== -1) inputs.splice(index, 1);
    // remove focus
    if (this._hasFocus) this.blur();
    // remove the hidden input box
    document.body.removeChild(this._hiddenInput);
    // remove off-DOM canvas
    this.#renderCanvas = null;
    this.#shadowCanvas = null;
    this.#renderCtx = null;
  }

  /**
   * Draw the text box area with either an image or background color.
   * @param {Function} fn Callback.
   */
  _drawTextBox(fn) {
    const ctx = this.#renderCtx,
      w = this.outerW,
      h = this.outerH,
      br = this._borderRadius,
      bw = this._borderWidth,
      sw = this.shadowW,
      sh = this.shadowH;

    // only draw the background shape if no image is being used
    if (this._backgroundImage === "") {
      ctx.fillStyle = this._backgroundColor;
      this._roundedRect(
        ctx,
        bw + this.shadowL,
        bw + this.shadowT,
        w - bw * 2 - sw,
        h - bw * 2 - sh,
        br
      );
      ctx.fill();
      fn();
    } else {
      const img = new Image();
      img.src = this._backgroundImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, img.width, img.height, bw + this.shadowL, bw + this.shadowT, w, h);
        fn();
      };
    }
  }

  /**
   * Deletes selected text in selection range and repositions cursor.
   * @return {Boolean} true if text removed.
   */
  _clearSelection() {
    if (this._selection[1] <= 0) return false;
    const [start, end] = this._selection; // clear the selected contents
    this._value = this._value.substring(0, start) + this._value.substring(end);
    this._cursorPos = start;
    this._cursorPos = this._cursorPos < 0 ? 0 : this._cursorPos;
    this._selection = [0, 0];
    return true;
  }

  /**
   * Clip the text string to only return what fits in the visible text box.
   * @param {string} value The text to clip.
   * @return {string} The clipped text.
   */
  _clipText(value) {
    value = value == null ? this._value : value;

    const textWidth = this._textWidth(value),
      fillPer = textWidth / (this._width - this._padding),
      text = fillPer > 1 ? value.substring(-1 * Math.floor(value.length / fillPer)) : value;

    return text + "";
  }

  /**
   * Gets the pixel with of passed text.
   * @param {string} text The text to measure.
   * @return {number} The measured width.
   */
  _textWidth(text) {
    const ctx = this.#renderCtx;
    ctx.font =
      this._fontStyle + " " + this._fontWeight + " " + this._fontSize + "px " + this._fontFamily;
    ctx.textAlign = "left";
    return ctx.measureText(text).width;
  }

  /**
   * Recalculate the outer with and height of the text box.
   */
  #calculateSize() {
    // calculate the full width and height with padding, borders and shadows
    this.outerW = this._width + this._padding * 2 + this._borderWidth * 2 + this.shadowW;
    this.outerH = this._height + this._padding * 2 + this._borderWidth * 2 + this.shadowH;
  }

  /**
   * Update the width and height of the off-DOM canvas when attributes are changed.
   */
  _updateCanvasWH() {
    const oldW = this.#renderCanvas.width,
      oldH = this.#renderCanvas.height;

    // update off-DOM canvas
    this.#renderCanvas.setAttribute("width", this.outerW);
    this.#renderCanvas.setAttribute("height", this.outerH);
    this.#shadowCanvas.setAttribute("width", this._width + this._padding * 2);
    this.#shadowCanvas.setAttribute("height", this._height + this._padding * 2);

    // clear the main canvas
    if (this._ctx) {
      this._ctx.clearRect(this._x, this._y, oldW, oldH);
    }
  }

  /**
   * Update the size and position of the hidden input (better UX on mobile).
   */
  _updateHiddenInput() {
    this._hiddenInput.style.left =
      this._x + this._extraX + (this._canvas ? this._canvas.offsetLeft : 0) + "px";
    this._hiddenInput.style.top =
      this._y + this._extraY + (this._canvas ? this._canvas.offsetTop : 0) + "px";
    this._hiddenInput.style.width = this._width + this._padding * 2 + "px";
    this._hiddenInput.style.height = this._height + this._padding * 2 + "px";
  }

  /**
   * Creates the path for a rectangle with rounded corners.
   * Must call ctx.fill() after calling this to draw the rectangle.
   * @param {Object} ctx Canvas context.
   * @param {number} x   x-coordinate to draw from.
   * @param {number} y   y-coordinate to draw from.
   * @param {number} w   Width of rectangle.
   * @param {number} h   Height of rectangle.
   * @param {number} r   Border radius.
   */
  _roundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    ctx.beginPath();

    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.closePath();
  }

  /**
   * Checks if a coordinate point is over the input box.
   * @param {number} x x-coordinate position.
   * @param {number} y y-coordinate position.
   * @return {Boolean}   True if it is over the input box.
   */
  _overInput(x, y) {
    const xLeft = x >= this._x + this._extraX,
      xRight = x <= this._x + this._extraX + this._width + this._padding * 2,
      yTop = y >= this._y + this._extraY,
      yBottom = y <= this._y + this._extraY + this._height + this._padding * 2;

    return xLeft && xRight && yTop && yBottom;
  }

  /**
   * Use the mouse's x & y coordinates to determine
   * the position clicked in the text.
   * @param {number} x X-coordinate.
   * @param {number} y Y-coordinate.
   * @return {number}   Cursor position.
   */
  _clickPos(x) {
    let value = this._value;

    // don't count placeholder text in this
    if (this._value === this._placeHolder) value = "";

    // determine where the click was made along the string
    const text = this._clipText(value);
    let totalW = 0,
      pos = text.length;

    if (x - (this._x + this._extraX) < this._textWidth(text)) {
      // loop through each character to identify the position
      for (let i = 0; i < text.length; i++) {
        totalW += this._textWidth(text[i]);
        if (totalW >= x - (this._x + this._extraX)) {
          pos = i;
          break;
        }
      }
    }

    return pos;
  }

  /**
   * Calculate the mouse position based on the event callback and the elements on the page.
   * @param {Event} e
   * @return {Object}   x & y values
   */
  _mousePos(e) {
    let elm = e.target,
      x = e.pageX,
      y = e.pageY;

    // support touch events in page location calculation
    if (e.touches && e.touches.length) {
      elm = e.touches[0].target;
      x = e.touches[0].pageX;
      y = e.touches[0].pageY;
    } else if (e.changedTouches && e.changedTouches.length) {
      elm = e.changedTouches[0].target;
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY;
    }

    const style = document.defaultView.getComputedStyle(elm, undefined),
      paddingLeft = parseInt(style["paddingLeft"], 10) || 0,
      paddingTop = parseInt(style["paddingLeft"], 10) || 0,
      borderLeft = parseInt(style["borderLeftWidth"], 10) || 0,
      borderTop = parseInt(style["borderLeftWidth"], 10) || 0,
      htmlTop = document.body.parentNode.offsetTop || 0,
      htmlLeft = document.body.parentNode.offsetLeft || 0;
    let offsetX = 0,
      offsetY = 0;

    // calculate the total offset
    if (typeof elm.offsetParent !== "undefined") {
      do {
        offsetX += elm.offsetLeft;
        offsetY += elm.offsetTop;
      } while ((elm = elm.offsetParent));
    }

    // take into account borders and padding
    offsetX += paddingLeft + borderLeft + htmlLeft;
    offsetY += paddingTop + borderTop + htmlTop;

    return {
      x: x - offsetX,
      y: y - offsetY,
    };
  }
}
