class ModalDialog {
  onOk = null;
  onCancel = null;

  text = "";
  okText = "";
  cancelText = "";

  /** @type {HTMLDivElement} */
  background = null;
  /** @type {HTMLDivElement} */
  dialogBox = null;
  /** @type {HTMLDivElement} */
  buttonDiv = null;

  constructor(text, okText, cancelText) {
    this.text = text;
    this.okText = okText || "OK";
    this.cancelText = cancelText || "Cancel";
    this.background = $new("div");
    this.background.classList.add("modalDialogBackground");
    this.dialogBox = $new("div");
    this.dialogBox.classList.add("modalDialogBox");
    this.background.append(this.dialogBox);
    document.body.append(this.background);
    this.initDialog();
  }

  initDialog() {
    this.buttonDiv = $new("div");
    this.buttonDiv.classList.add("modalDialogButtons");

    const okButton = $new("button");
    okButton.classList.add("button");
    okButton.textContent = this.okText;
    const cancelButton = $new("button");
    cancelButton.classList.add("button");
    cancelButton.textContent = this.cancelText;

    okButton.addEventListener("click", () => this.clickOk());
    this.buttonDiv.append(okButton);
    cancelButton.addEventListener("click", () => this.clickCancel());
    this.buttonDiv.append(cancelButton);

    this.dialogBox.innerHTML = '<div class="modalDialogText">' + this.text + "</div>";
    this.dialogBox.append(this.buttonDiv);
  }

  clickOk() {
    if (this.onOk) this.onOk(this);
    this.close();
  }

  clickCancel() {
    if (this.onCancel) this.onCancel(this);
    this.close();
  }

  open() {
    // TODO
    this.background.fadeIn(100);
  }

  close() {
    // TODO
    this.background.fadeOut(100);
  }
}

class ModalDialogPathSelect extends ModalDialog {
  pathDropdown = null;
  pathInput = null;
  fileType = "";

  constructor(text, okText, type) {
    this.fileType = type || "";
    this.parent(text, okText || "Select");
  }

  setPath(path) {
    const dir = path.replace(/\/[^\/]*$/, "");
    this.pathInput.val(path);
    this.pathDropdown.loadDir(dir);
  }

  initDialog() {
    this.parent();
    this.pathInput = $("<input/>", { type: "text", class: "modalDialogPath" });
    this.buttonDiv.before(this.pathInput);
    this.pathDropdown = new wm.SelectFileDropdown(
      this.pathInput,
      wm.config.api.browse,
      this.fileType
    );
  }

  clickOk() {
    if (this.onOk) this.onOk(this, this.pathInput.val());
    this.close();
  }
}
