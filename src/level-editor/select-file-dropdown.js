class SelectFileDropdown {
  /** @type {HTMLElement} */
  div = null;
  /** @type {HTMLElement} */
  input = null;
  boundShow = null;
  filelistPHP = "";
  filetype = "";

  // TODO!
  // constructor(elementId, filelistPHP, filetype) {
  constructor({ elementId, api, filetype } = {}) {
    Guard.againstNull({ api });
    this.api = api;
    this.filetype = filetype || "";
    this.input = $el(elementId);
    this.input.addEventListener("focus", (e) => this.show(e));
    this.div = $new("div");
    this.div.classList.add("selectFileDialog");
    this.div.addEventListener("mousedown", (e) => this.noHide(e));

    this.input.after(this.div);
    this.loadDir("");
  }

  loadDir(dir) {
    this.api.client
      .browse(dir, this.filetype)
      .then((data) => this.showFiles(data))
      .catch((err) => console.log(err));
  }

  selectDir(event) {
    this.loadDir(event.target.href);
    return false;
  }

  selectFile(event) {
    this.input.value = event.target.href;
    this.input.blur();
    this.hide();
    return false;
  }

  showFiles(data) {
    this.div.innerHTML = "";
    if (data.parent !== false) {
      const parent = $new("a");
      parent.classList.add("dir");
      parent.href = data.parent;
      parent.innerHTML = "&hellip;parent directory";
      parent.addEventListener("click", (e) => this.selectDir(e));
      this.div.append(parent);
    }
    for (let i = 0; i < data.dirs.length; i++) {
      const name = data.dirs[i].match(/[^\/]*$/)[0] + "/";
      const dir = $new("a");
      dir.classList.add("dir");
      dir.href = data.dirs[i];
      dir.innerHTML = name;
      dir.title = name;
      dir.addEventListener("click", (e) => this.selectDir(e));
      this.div.append(dir);
    }
    for (let i = 0; i < data.files.length; i++) {
      const name = data.files[i].match(/[^\/]*$/)[0];
      const file = $new("a");
      file.classList.add("file");
      file.href = data.files[i];
      file.innerHTML = name;
      file.title = name;
      file.addEventListener("click", (e) => this.selectFile(e));
      this.div.append(file);
    }
  }

  noHide(event) {
    event.stopPropagation();
  }

  show(_event) {
    const top = this.input.offsetTop;
    const left = this.input.offsetLeft;
    const inputHeight = getInnerHeight(this.input) + parseInt(this.input.style.marginTop);
    const inputWidth = getInnerWidth(this.input);
    document.addEventListener("mousedown", () => this.hide());
    this.div.top = `${top + inputHeight + 1}px`;
    this.div.left = `${left}px`;
    this.div.width = `${inputWidth}px`;
    slideDown(this.div, 100);
  }

  hide() {
    document.removeEventListener("mousedown", () => this.hide());
    slideUp(this.div, 100);
  }
}
