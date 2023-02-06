import { $new } from "../modules/lib/dom-utils.js";
import { Guard } from "../modules/lib/guard.js";
import { fadeOut, fadeIn } from "../modules/lib/ui-effects.js";
import { SelectFileDropdown } from "./select-file-dropdown.js";

export class ModalDialog {
  onOk = null;
  onCancel = null;

  text = "";
  okText = "";
  cancelText = "";

  /** @type {HTMLDivElement} */
  background = null;
  /** @type {HTMLDivElement} */
  dialogBox = null;

  constructor({ text, okText, cancelText, autoInit } = {}) {
    this.text = text;
    this.okText = okText || "OK";
    this.cancelText = cancelText || "Cancel";
    this.background = $new("div");
    this.background.classList.add("modalDialogBackground");
    this.dialogBox = $new("div");
    this.dialogBox.classList.add("modalDialogBox");
    this.background.append(this.dialogBox);
    const firstScript = document.body.querySelector("script");
    firstScript.before(this.background);
    if (autoInit) this.initDialog();
  }

  initDialog() {
    const okButton = $new("button");
    okButton.classList.add("button");
    okButton.textContent = this.okText;
    okButton.addEventListener("click", () => this.clickOk());

    const cancelButton = $new("button");
    cancelButton.classList.add("button");
    cancelButton.textContent = this.cancelText;
    cancelButton.addEventListener("click", () => this.clickCancel());

    const buttonDiv = $new("div");
    buttonDiv.classList.add("modalDialogButtons");
    buttonDiv.append(okButton);
    buttonDiv.append(cancelButton);

    this.dialogBox.innerHTML = `<div class="modalDialogText">${this.text}</div>`;
    this.dialogBox.append(buttonDiv);
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
    fadeIn(this.background, { duration: 100 });
  }

  close() {
    fadeOut(this.background, { duration: 100 });
  }
}

export class ModalDialogPathSelect extends ModalDialog {
  pathDropdown = null;
  pathInput = null;
  fileType = "";

  constructor({ text, okText = "Select", type = "", httpClient } = {}) {
    super({ text, okText, autoInit: false });
    Guard.againstNull({ httpClient });
    Guard.againstNull({ type });
    this.httpClient = httpClient;
    this.fileType = type;
    this.initDialog();
  }

  setPath(path) {
    const dir = path.replace(/\/[^/]*$/, "");
    this.pathInput.value = path;
    this.pathDropdown.loadDir(dir);
  }

  initDialog() {
    super.initDialog();
    this.pathInput = $new("input");
    this.pathInput.type = "text";
    this.pathInput.autocomplete = "off";
    this.pathInput.classList.add("modalDialogPath");
    // Insert dropdown before dialog buttons but after title.
    this.dialogBox.insertBefore(this.pathInput, this.dialogBox.children[1]);
    this.pathDropdown = new SelectFileDropdown({
      elementId: this.pathInput,
      filetype: this.fileType,
      httpClient: this.httpClient,
    });
  }

  clickOk() {
    if (this.onOk) this.onOk(this, this.pathInput.value);
    this.close();
  }
}
