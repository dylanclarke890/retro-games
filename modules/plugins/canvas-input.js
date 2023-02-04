// create a buffer that stores all inputs so that tabbing
// between them is made possible.
const inputs = [];
const noOp = () => {};
// initialize the Canvas Input
export class CanvasInput {
  constructor(opts) {
    // setup the defaults
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

    // parse box shadow
    this.boxShadow(this._boxShadow, true);

    // calculate the full width and height with padding, borders and shadows
    this._calculate();

    // setup the off-DOM canvas
    this._renderCanvas = document.createElement("canvas");
    this._renderCanvas.setAttribute("width", this.outerW);
    this._renderCanvas.setAttribute("height", this.outerH);
    this._renderCtx = this._renderCanvas.getContext("2d");

    // setup another off-DOM canvas for inner-shadows
    this._shadowCanvas = document.createElement("canvas");
    this._shadowCanvas.setAttribute("width", this._width + this._padding * 2);
    this._shadowCanvas.setAttribute("height", this._height + this._padding * 2);
    this._shadowCtx = this._shadowCanvas.getContext("2d");

    // setup the background color
    if (opts.backgroundGradient) {
      this._backgroundColor = this._renderCtx.createLinearGradient(0, 0, 0, this.outerH);
      this._backgroundColor.addColorStop(0, opts.backgroundGradient[0]);
      this._backgroundColor.addColorStop(1, opts.backgroundGradient[1]);
    } else this._backgroundColor = opts.backgroundColor || "#fff";

    // setup main canvas events
    if (this._canvas) {
      this._canvas.addEventListener("mousemove", (e) => this.mousemove(e), false);
      this._canvas.addEventListener("mousedown", (e) => this.mousedown(e), false);
      this._canvas.addEventListener("mouseup", (e) => this.mouseup(e), false);
    }

    // setup a global mouseup to blur the input outside of the canvas
    const autoBlur = () => {
      if (this._hasFocus && !this._mouseDown) this.blur();
    };
    window.addEventListener("mouseup", autoBlur, true);
    window.addEventListener("touchend", autoBlur, true);

    // create the hidden input element
    this._hiddenInput = document.createElement("input");
    this._hiddenInput.type = "text";
    this._hiddenInput.style.position = "absolute";
    this._hiddenInput.style.opacity = 0;
    this._hiddenInput.style.pointerEvents = "none";
    this._hiddenInput.style.zIndex = 0;
    // hide native blue text cursor on iOS
    this._hiddenInput.style.transform = "scale(0)";

    this._updateHiddenInput();
    if (this._maxlength) this._hiddenInput.maxLength = this._maxlength;
    document.body.appendChild(this._hiddenInput);
    this._hiddenInput.value = this._value;

    // setup the keydown listener
    this._hiddenInput.addEventListener("keydown", (e) => {
      if (this._hasFocus) {
        window.focus(); // hack to fix touch event bug in iOS Safari
        this._hiddenInput.focus();
        // continue with the keydown event
        this.keydown(e);
      }
    });

    // setup the keyup listener
    this._hiddenInput.addEventListener("keyup", (e) => {
      // update the canvas input state information from the hidden input
      this._value = this._hiddenInput.value;
      this._cursorPos = this._hiddenInput.selectionStart;
      // update selection to hidden input's selection in case user did keyboard-based selection
      this._selection = [this._hiddenInput.selectionStart, this._hiddenInput.selectionEnd];
      this.render();
      if (this._hasFocus) this._onkeyup(e);
    });

    // add this to the buffer
    inputs.push(this);
    this._inputsIndex = inputs.length - 1;

    this.render();
  }

  /**
   * Get/set the font weight.
   * @param {string} data Font weight.
   * @return {this | string} CanvasInput or current font weight.
   */
  fontWeight(data) {
    if (data != null) {
      this._fontWeight = data;
      return this.render();
    } else return this._fontWeight;
  }
  // setup the prototype
  /**
   * Get/set the font style.
   * @param {string} data Font style.
   * @return {this | string}      CanvasInput or current font style.
   */
  fontStyle(data) {
    if (data != null) {
      this._fontStyle = data;

      return this.render();
    } else {
      return this._fontStyle;
    }
  }
  // setup the prototype
  /**
   * Get/set the font shadow color.
   * @param {string} data Font shadow color.
   * @return {this | string}      CanvasInput or current font shadow color.
   */
  fontShadowColor(data) {
    if (data != null) {
      this._fontShadowColor = data;

      return this.render();
    } else {
      return this._fontShadowColor;
    }
  }
  // setup the prototype
  /**
   * Get/set the font shadow blur.
   * @param {string} data Font shadow blur.
   * @return {this | string}      CanvasInput or current font shadow blur.
   */
  fontShadowBlur(data) {
    if (data != null) {
      this._fontShadowBlur = data;

      return this.render();
    } else {
      return this._fontShadowBlur;
    }
  }
  // setup the prototype
  /**
   * Get/set the font shadow x-offset.
   * @param {string} data Font shadow x-offset.
   * @return {this | string}      CanvasInput or current font shadow x-offset.
   */
  fontShadowOffsetX(data) {
    if (data != null) {
      this._fontShadowOffsetX = data;

      return this.render();
    } else {
      return this._fontShadowOffsetX;
    }
  }
  // setup the prototype
  /**
   * Get/set the font shadow y-offset.
   * @param {string} data Font shadow y-offset.
   * @return {this | string}      CanvasInput or current font shadow y-offset.
   */
  fontShadowOffsetY(data) {
    if (data != null) {
      this._fontShadowOffsetY = data;

      return this.render();
    } else {
      return this._fontShadowOffsetY;
    }
  }
  // setup the prototype
  /**
   * Get/set the width of the text box.
   * @param {number} data Width in pixels.
   * @return {this | string}      CanvasInput or current width.
   */
  width(data) {
    if (data != null) {
      this._width = data;
      this._calculate();
      this._updateCanvasWH();
      this._updateHiddenInput();

      return this.render();
    } else {
      return this._width;
    }
  }
  // setup the prototype
  /**
   * Get/set the height of the text box.
   * @param {number} data Height in pixels.
   * @return {this | string}      CanvasInput or current height.
   */
  height(data) {
    if (data != null) {
      this._height = data;
      this._calculate();
      this._updateCanvasWH();
      this._updateHiddenInput();

      return this.render();
    } else {
      return this._height;
    }
  }
  // setup the prototype
  /**
   * Get/set the padding of the text box.
   * @param {number} data Padding in pixels.
   * @return {this | string}      CanvasInput or current padding.
   */
  padding(data) {
    if (data != null) {
      this._padding = data;
      this._calculate();
      this._updateCanvasWH();

      return this.render();
    } else {
      return this._padding;
    }
  }
  // setup the prototype
  /**
   * Get/set the border width.
   * @param {number} data Border width.
   * @return {this | string}      CanvasInput or current border width.
   */
  borderWidth(data) {
    if (data != null) {
      this._borderWidth = data;
      this._calculate();
      this._updateCanvasWH();

      return this.render();
    } else {
      return this._borderWidth;
    }
  }
  // setup the prototype
  /**
   * Get/set the border color.
   * @param {string} data Border color.
   * @return {this | string}      CanvasInput or current border color.
   */
  borderColor(data) {
    if (data != null) {
      this._borderColor = data;

      return this.render();
    } else {
      return this._borderColor;
    }
  }
  // setup the prototype
  /**
   * Get/set the border radius.
   * @param {number} data Border radius.
   * @return {this | string}      CanvasInput or current border radius.
   */
  borderRadius(data) {
    if (data != null) {
      this._borderRadius = data;

      return this.render();
    } else {
      return this._borderRadius;
    }
  }
  // setup the prototype
  /**
   * Get/set the background color.
   * @param {number} data Background color.
   * @return {this | string}      CanvasInput or current background color.
   */
  backgroundColor(data) {
    if (data != null) {
      this._backgroundColor = data;

      return this.render();
    } else {
      return this._backgroundColor;
    }
  }
  // setup the prototype
  /**
   * Get/set the background gradient.
   * @param {number} data Background gradient.
   * @return {this | string}      CanvasInput or current background gradient.
   */
  backgroundGradient(data) {
    if (data != null) {
      this._backgroundColor = this._renderCtx.createLinearGradient(0, 0, 0, this.outerH);
      this._backgroundColor.addColorStop(0, data[0]);
      this._backgroundColor.addColorStop(1, data[1]);

      return this.render();
    } else {
      return this._backgroundColor;
    }
  }
  // setup the prototype
  /**
   * Get/set the box shadow.
   * @param {string} data     Box shadow in CSS format (1px 1px 1px rgba(0, 0, 0.5)).
   * @param {Boolean} doReturn (optional) True to prevent a premature render.
   * @return {this | string}          CanvasInput or current box shadow.
   */
  boxShadow(data, doReturn) {
    if (data != null) {
      // parse box shadow
      var boxShadow = data.split("px ");
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

      this._calculate();

      if (!doReturn) {
        this._updateCanvasWH();

        return this.render();
      }
    } else {
      return this._boxShadow;
    }
  }
  // setup the prototype
  /**
   * Get/set the inner shadow.
   * @param {string} data In the format of a CSS box shadow (1px 1px 1px rgba(0, 0, 0.5)).
   * @return {this | string}          CanvasInput or current inner shadow.
   */
  innerShadow(data) {
    if (data != null) {
      this._innerShadow = data;

      return this.render();
    } else {
      return this._innerShadow;
    }
  }
  // setup the prototype
  /**
   * Get/set the text selection color.
   * @param {string} data Color.
   * @return {this | string}      CanvasInput or current selection color.
   */
  selectionColor(data) {
    if (data != null) {
      this._selectionColor = data;

      return this.render();
    } else {
      return this._selectionColor;
    }
  }
  // setup the prototype
  /**
   * Get/set the place holder text.
   * @param {string} data Place holder text.
   * @return {this | string}      CanvasInput or current place holder text.
   */
  placeHolder(data) {
    if (data != null) {
      this._placeHolder = data;

      return this.render();
    } else {
      return this._placeHolder;
    }
  }
  // setup the prototype
  /**
   * Get/set the current text box value.
   * @param {string} data Text value.
   * @return {this | string}      CanvasInput or current text value.
   */
  value(data) {
    if (data != null) {
      this._value = data + "";
      this._hiddenInput.value = data + "";

      // update the cursor position
      this._cursorPos = this._clipText().length;

      this.render();

      return this;
    } else {
      return this._value === this._placeHolder ? "" : this._value;
    }
  }
  // setup the prototype
  /**
   * Set or fire the onsubmit event.
   * @param {Function} fn Custom callback.
   */
  onsubmit(fn) {
    if (typeof fn !== "undefined") {
      this._onsubmit = fn;

      return this;
    } else {
      this._onsubmit();
    }
  }
  // setup the prototype
  /**
   * Set or fire the onkeydown event.
   * @param {Function} fn Custom callback.
   */
  onkeydown(fn) {
    if (typeof fn !== "undefined") {
      this._onkeydown = fn;

      return this;
    } else {
      this._onkeydown();
    }
  }
  // setup the prototype
  /**
   * Set or fire the onkeyup event.
   * @param {Function} fn Custom callback.
   */
  onkeyup(fn) {
    if (typeof fn !== "undefined") {
      this._onkeyup = fn;

      return this;
    } else {
      this._onkeyup();
    }
  }
  // setup the prototype
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
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i]._hasFocus) {
          inputs[i].blur();
        }
      }
    }

    // remove selection
    if (!this._selectionUpdated) {
      this._selection = [0, 0];
    } else {
      delete this._selectionUpdated;
    }

    // if this is readonly, don't allow it to get focus
    this._hasFocus = true;
    if (this._readonly) {
      this._hiddenInput.readOnly = true;
    } else {
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
      if (this._cursorInterval) {
        clearInterval(this._cursorInterval);
      }
      this._cursorInterval = setInterval(function () {
        this._cursor = !this._cursor;
        this.render();
      }, 500);
    }

    // move the real focus to the hidden input
    var hasSelection = this._selection[0] > 0 || this._selection[1] > 0;
    this._hiddenInput.focus();
    this._hiddenInput.selectionStart = hasSelection ? this._selection[0] : this._cursorPos;
    this._hiddenInput.selectionEnd = hasSelection ? this._selection[1] : this._cursorPos;

    return this.render();
  }
  // setup the prototype
  /**
   * Removes focus from the CanvasInput box.
   * @param {Object} _this Reference to this.
   * @return {CanvasInput}
   */
  blur(_this) {
    this._onblur(this);

    if (this._cursorInterval) {
      clearInterval(this._cursorInterval);
    }
    this._hasFocus = false;
    this._cursor = false;
    this._selection = [0, 0];
    this._hiddenInput.blur();

    // fill the place holder
    if (this._value === "") {
      this._value = this._placeHolder;
    }

    return this.render();
  }
  // setup the prototype
  /**
   * Fired with the keydown event to draw the typed characters.
   * @param {Event}       e    The keydown event.
   * @param {CanvasInput} this
   * @return {CanvasInput}
   */
  keydown(e) {
    var keyCode = e.which;

    // make sure the correct text field is being updated
    if (this._readonly || !this._hasFocus) {
      return;
    }

    // fire custom user event
    this._onkeydown(e, this);

    // add support for Ctrl/Cmd+A selection
    if (keyCode === 65 && (e.ctrlKey || e.metaKey)) {
      this.selectText();
      e.preventDefault();
      return this.render();
    }

    // block keys that shouldn't be processed
    if (keyCode === 17 || e.metaKey || e.ctrlKey) {
      return this;
    }

    if (keyCode === 13) {
      // enter key
      e.preventDefault();
      this._onsubmit(e, this);
    } else if (keyCode === 9) {
      // tab key
      e.preventDefault();
      if (inputs.length > 1) {
        var next = inputs[this._inputsIndex + 1] ? this._inputsIndex + 1 : 0;
        this.blur();
        setTimeout(function () {
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
  // setup the prototype
  /**
   * Fired with the click event on the canvas, and puts focus on/off
   * based on where the user clicks.
   * @param {Event}       e    The click event.
   * @param {CanvasInput} this
   * @return {CanvasInput}
   */
  click(e) {
    var mouse = this._mousePos(e),
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
        this.click(e, this);
        return this.focus(this._clickPos(x, y));
      }
    } else {
      return this.blur();
    }
  }
  // setup the prototype
  /**
   * Fired with the mousemove event to update the default cursor.
   * @param {Event}       e    The mousemove event.
   * @param {CanvasInput} this
   * @return {CanvasInput}
   */
  mousemove(e) {
    var mouse = this._mousePos(e),
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
      var curPos = this._clickPos(x, y),
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
  // setup the prototype
  /**
   * Fired with the mousedown event to start a selection drag.
   * @param {Event} e    The mousedown event.
   * @param {CanvasInput} this
   */
  mousedown(e) {
    var mouse = this._mousePos(e),
      x = mouse.x,
      y = mouse.y,
      isOver = this._overInput(x, y);

    // setup the 'click' event
    this._mouseDown = isOver;

    // start the selection drag if inside the input
    if (this._hasFocus && isOver) {
      this._selectionStart = this._clickPos(x, y);
    }
  }
  // setup the prototype
  /**
   * Fired with the mouseup event to end a selection drag.
   * @param {Event} e    The mouseup event.
   * @param {CanvasInput} this
   */
  mouseup(e) {
    var mouse = this._mousePos(e),
      x = mouse.x,
      y = mouse.y;

    // update selection if a drag has happened
    var isSelection = this._clickPos(x, y) !== this._selectionStart;
    if (this._hasFocus && this._selectionStart >= 0 && this._overInput(x, y) && isSelection) {
      this._selectionUpdated = true;
      delete this._selectionStart;
      this.render();
    } else {
      delete this._selectionStart;
    }

    this.click(e, this);
  }
  // setup the prototype
  /**
   * Select a range of text in the input.
   * @param {Array} range (optional) Leave blank to select all. Format: [start, end]
   * @return {CanvasInput}
   */
  selectText(range) {
    range = range || [0, this._value.length];

    // select the range of text specified (or all if none specified)
    setTimeout(function () {
      this._selection = [range[0], range[1]];
      this._hiddenInput.selectionStart = range[0];
      this._hiddenInput.selectionEnd = range[1];
      this.render();
    }, 1);

    return this;
  }
  // setup the prototype
  /**
   * Helper method to get the off-DOM canvas.
   * @return {Object} Reference to the canvas.
   */
  renderCanvas() {
    return this._renderCanvas;
  }
  // setup the prototype
  /**
   * Clears and redraws the CanvasInput on an off-DOM canvas,
   * and if a main canvas is provided, draws it all onto that.
   * @return {CanvasInput}
   */
  render() {
    var ctx = this._renderCtx,
      w = this.outerW,
      h = this.outerH,
      br = this._borderRadius,
      bw = this._borderWidth,
      sw = this.shadowW,
      sh = this.shadowH;

    if (!ctx) {
      return;
    }

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
    this._drawTextBox(function () {
      // make sure all shadows are reset
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;

      // clip the text so that it fits within the box
      var text = this._clipText();

      // draw the selection
      var paddingBorder = this._padding + this._borderWidth + this.shadowT;
      if (this._selection[1] > 0) {
        var selectOffset = this._textWidth(text.substring(0, this._selection[0])),
          selectWidth = this._textWidth(text.substring(this._selection[0], this._selection[1]));

        ctx.fillStyle = this._selectionColor;
        ctx.fillRect(paddingBorder + selectOffset, paddingBorder, selectWidth, this._height);
      }

      // draw the cursor
      if (this._cursor) {
        var cursorOffset = this._textWidth(text.substring(0, this._cursorPos));
        ctx.fillStyle = this._fontColor;
        ctx.fillRect(paddingBorder + cursorOffset, paddingBorder, 1, this._height);
      }

      // draw the text
      var textX = this._padding + this._borderWidth + this.shadowL,
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
      var innerShadow = this._innerShadow.split("px "),
        isOffsetX = this._innerShadow === "none" ? 0 : parseInt(innerShadow[0], 10),
        isOffsetY = this._innerShadow === "none" ? 0 : parseInt(innerShadow[1], 10),
        isBlur = this._innerShadow === "none" ? 0 : parseInt(innerShadow[2], 10),
        isColor = this._innerShadow === "none" ? "" : innerShadow[3];

      // draw the inner-shadow (damn you canvas, this should be easier than this...)
      if (isBlur > 0) {
        var shadowCtx = this._shadowCtx,
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
  // setup the prototype
  /**
   * Destroy this input and stop rendering it.
   */
  destroy() {
    // pull from the inputs array
    var index = inputs.indexOf(this);
    if (index != -1) {
      inputs.splice(index, 1);
    }

    // remove focus
    if (this._hasFocus) {
      this.blur();
    }

    // remove the hidden input box
    document.body.removeChild(this._hiddenInput);

    // remove off-DOM canvas
    this._renderCanvas = null;
    this._shadowCanvas = null;
    this._renderCtx = null;
  }
  // setup the prototype
  /**
   * Draw the text box area with either an image or background color.
   * @param {Function} fn Callback.
   */
  _drawTextBox(fn) {
    var ctx = this._renderCtx,
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
      var img = new Image();
      img.src = this._backgroundImage;
      img.onload = function () {
        ctx.drawImage(img, 0, 0, img.width, img.height, bw + this.shadowL, bw + this.shadowT, w, h);

        fn();
      };
    }
  }
  // setup the prototype
  /**
   * Deletes selected text in selection range and repositions cursor.
   * @return {Boolean} true if text removed.
   */
  _clearSelection() {
    if (this._selection[1] > 0) {
      // clear the selected contents
      var start = this._selection[0],
        end = this._selection[1];

      this._value = this._value.substr(0, start) + this._value.substr(end);
      this._cursorPos = start;
      this._cursorPos = this._cursorPos < 0 ? 0 : this._cursorPos;
      this._selection = [0, 0];

      return true;
    }

    return false;
  }
  // setup the prototype
  /**
   * Clip the text string to only return what fits in the visible text box.
   * @param {string} value The text to clip.
   * @return {string} The clipped text.
   */
  _clipText(value) {
    value = typeof value === "undefined" ? this._value : value;

    var textWidth = this._textWidth(value),
      fillPer = textWidth / (this._width - this._padding),
      text = fillPer > 1 ? value.substr(-1 * Math.floor(value.length / fillPer)) : value;

    return text + "";
  }
  // setup the prototype
  /**
   * Gets the pixel with of passed text.
   * @param {string} text The text to measure.
   * @return {number}      The measured width.
   */
  _textWidth(text) {
    var ctx = this._renderCtx;

    ctx.font =
      this._fontStyle + " " + this._fontWeight + " " + this._fontSize + "px " + this._fontFamily;
    ctx.textAlign = "left";

    return ctx.measureText(text).width;
  }
  // setup the prototype
  /**
   * Recalculate the outer with and height of the text box.
   */
  _calculate() {
    // calculate the full width and height with padding, borders and shadows
    this.outerW = this._width + this._padding * 2 + this._borderWidth * 2 + this.shadowW;
    this.outerH = this._height + this._padding * 2 + this._borderWidth * 2 + this.shadowH;
  }
  // setup the prototype
  /**
   * Update the width and height of the off-DOM canvas when attributes are changed.
   */
  _updateCanvasWH() {
    var oldW = this._renderCanvas.width,
      oldH = this._renderCanvas.height;

    // update off-DOM canvas
    this._renderCanvas.setAttribute("width", this.outerW);
    this._renderCanvas.setAttribute("height", this.outerH);
    this._shadowCanvas.setAttribute("width", this._width + this._padding * 2);
    this._shadowCanvas.setAttribute("height", this._height + this._padding * 2);

    // clear the main canvas
    if (this._ctx) {
      this._ctx.clearRect(this._x, this._y, oldW, oldH);
    }
  }
  // setup the prototype
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
  // setup the prototype
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
  // setup the prototype
  /**
   * Checks if a coordinate point is over the input box.
   * @param {number} x x-coordinate position.
   * @param {number} y y-coordinate position.
   * @return {Boolean}   True if it is over the input box.
   */
  _overInput(x, y) {
    var xLeft = x >= this._x + this._extraX,
      xRight = x <= this._x + this._extraX + this._width + this._padding * 2,
      yTop = y >= this._y + this._extraY,
      yBottom = y <= this._y + this._extraY + this._height + this._padding * 2;

    return xLeft && xRight && yTop && yBottom;
  }
  // setup the prototype
  /**
   * Use the mouse's x & y coordinates to determine
   * the position clicked in the text.
   * @param {number} x X-coordinate.
   * @param {number} y Y-coordinate.
   * @return {number}   Cursor position.
   */
  _clickPos(x, y) {
    var value = this._value;

    // don't count placeholder text in this
    if (this._value === this._placeHolder) {
      value = "";
    }

    // determine where the click was made along the string
    var text = this._clipText(value),
      totalW = 0,
      pos = text.length;

    if (x - (this._x + this._extraX) < this._textWidth(text)) {
      // loop through each character to identify the position
      for (var i = 0; i < text.length; i++) {
        totalW += this._textWidth(text[i]);
        if (totalW >= x - (this._x + this._extraX)) {
          pos = i;
          break;
        }
      }
    }

    return pos;
  }
  // setup the prototype
  /**
   * Calculate the mouse position based on the event callback and the elements on the page.
   * @param {Event} e
   * @return {Object}   x & y values
   */
  _mousePos(e) {
    var elm = e.target,
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

    var style = document.defaultView.getComputedStyle(elm, undefined),
      paddingLeft = parseInt(style["paddingLeft"], 10) || 0,
      paddingTop = parseInt(style["paddingLeft"], 10) || 0,
      borderLeft = parseInt(style["borderLeftWidth"], 10) || 0,
      borderTop = parseInt(style["borderLeftWidth"], 10) || 0,
      htmlTop = document.body.parentNode.offsetTop || 0,
      htmlLeft = document.body.parentNode.offsetLeft || 0,
      offsetX = 0,
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
