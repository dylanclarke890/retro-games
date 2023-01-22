class SelectFileDropdown {
  boundShow = null;
  /** @type {HTMLElement} */
  div = null;
  filetype = "";
  /** @type {LevelEditorHttpClient} */
  httpClient = null;
  /** @type {HTMLElement} */
  input = null;

  constructor({ elementId, httpClient, filetype } = {}) {
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

  showFiles(data) {
    this.div.innerHTML = "";
    if (data.parent !== false) {
      const parent = $new("div");
      parent.classList.add("dir");
      parent.dataset.path = data.parent;
      parent.innerHTML = "&hellip;parent directory";
      parent.addEventListener("click", () => this.selectDir(parent));
      this.div.append(parent);
    }
    for (let i = 0; i < data.dirs.length; i++) {
      const name = data.dirs[i].match(/[^\/]*$/)[0] + "/";
      const dir = $new("div");
      dir.classList.add("dir");
      dir.innerHTML = name;
      dir.dataset.path = data.dirs[i];
      dir.addEventListener("click", () => this.selectDir(dir));
      this.div.append(dir);
    }
    for (let i = 0; i < data.files.length; i++) {
      const name = data.files[i].match(/[^\/]*$/)[0];
      const file = $new("div");
      file.classList.add("file");
      file.innerHTML = name;
      file.dataset.path = data.files[i];
      file.addEventListener("click", () => this.selectFile(file));
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
