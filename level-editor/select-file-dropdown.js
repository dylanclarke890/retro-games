import { Guard } from "../modules/lib/guard.js";
import { $new, $el, getInnerHeight, getInnerWidth } from "../modules/lib/dom-utils.js";
import { slideUp, slideDown } from "../modules/lib/ui-effects.js";

export class SelectFileDropdown {
  boundShow = null;
  /** @type {HTMLElement} */
  div = null;
  filetype = "";
  /** @type {LevelEditorHttpClient} */
  httpClient = null;
  /** @type {HTMLElement} */
  input = null;

  constructor({ elementId, httpClient, filetype } = {}) {
    Guard.againstNull({ elementId });
    Guard.againstNull({ httpClient });

    this.httpClient = httpClient;
    this.filetype = filetype || "";

    this.div = $new("div");
    this.div.classList.add("selectFileDialog");
    this.div.addEventListener("mousedown", (e) => this.noHide(e));

    this.input = $el(elementId);
    this.input.addEventListener("mouseup", (e) => this.show(e));
    this.input.after(this.div);

    this.loadDir("");
  }

  loadDir(dir) {
    this.httpClient.api
      .browse(dir, this.filetype)
      .then((data) => this.showFiles(data))
      .catch((err) => console.error(err));
  }

  selectDir(dir) {
    this.loadDir(dir.dataset.path);
  }

  selectFile(file) {
    this.input.value = file.dataset.path;
    this.input.blur();
    this.hide();
  }

  addDropdownOption(path, textContent, type) {
    const option = $new("div");
    option.classList.add(type);
    option.dataset.path = path;
    option.textContent = textContent;
    const cb = type === "dir" ? () => this.selectDir(option) : () => this.selectFile(option);
    option.addEventListener("click", () => cb(option));
    this.div.append(option);
  }

  showFiles(data) {
    this.div.innerHTML = "";
    if (data.parent !== false) this.addDropdownOption(data.parent, "...parent directory", "dir");

    for (let i = 0; i < data.dirs.length; i++) {
      const name = data.dirs[i].match(/[^/]*$/)[0] + "/";
      this.addDropdownOption(data.dirs[i], name, "dir");
    }
    for (let i = 0; i < data.files.length; i++) {
      const name = data.files[i].match(/[^/]*$/)[0];
      this.addDropdownOption(data.files[i], name, "file");
    }
  }

  noHide(event) {
    event.stopPropagation();
  }

  // eslint-disable-next-line no-unused-vars
  show(_event) {
    const top = this.input.offsetTop;
    const left = this.input.offsetLeft;
    const inputHeight = getInnerHeight(this.input) + parseInt(this.input.style.marginTop);
    const inputWidth = getInnerWidth(this.input);
    document.addEventListener("mousedown", () => this.hide());
    this.div.style.top = `${top + inputHeight + 1}px`;
    this.div.style.left = `${left}px`;
    this.div.style.width = `${inputWidth}px`;
    slideDown(this.div, 100);
  }

  hide() {
    document.removeEventListener("mousedown", () => this.hide());
    slideUp(this.div, 100);
  }
}
