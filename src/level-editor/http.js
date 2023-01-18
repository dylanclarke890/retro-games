class HttpClient {
  /** @type {string} */
  #baseUrl;
  /** @type {Array<string>} */
  #headers;

  constructor({ baseUrl = "", headers = {} } = {}) {
    this.#baseUrl = baseUrl;
    this.#headers = headers;
  }

  async #fetchJSON(endpoint, opts = {}) {
    const res = await fetch(this.#baseUrl + endpoint, {
      ...opts,
      headers: this.#headers,
    });

    if (!res.ok) throw new Error(res.statusText);
    if (opts.parseResponse !== false && res.status !== 204) return res.json();
    return res.text();
  }

  setHeader(key, value) {
    this.#headers[key] = value;
    return this;
  }

  getHeader(key) {
    return this.#headers[key];
  }

  setBasicAuth(username, password) {
    this.#headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
    return this;
  }

  setBearerAuth(token) {
    this.#headers.Authorization = `Bearer ${token}`;
    return this;
  }

  get(endpoint, opts = {}) {
    return this.#fetchJSON(endpoint, {
      ...opts,
      method: "GET",
    });
  }

  post(endpoint, body, opts = {}) {
    return this.#fetchJSON(endpoint, {
      ...opts,
      body: body ? JSON.stringify(body) : undefined,
      method: "POST",
    });
  }

  put(endpoint, body, opts = {}) {
    return this.#fetchJSON(endpoint, {
      ...opts,
      body: body ? JSON.stringify(body) : undefined,
      method: "PUT",
    });
  }

  patch(endpoint, operations, opts = {}) {
    return this.#fetchJSON(endpoint, {
      parseResponse: false,
      ...opts,
      body: JSON.stringify(operations),
      method: "PATCH",
    });
  }

  delete(endpoint, opts = {}) {
    return this.#fetchJSON(endpoint, {
      parseResponse: false,
      ...opts,
      method: "DELETE",
    });
  }
}

class LevelEditorApi extends HttpClient {
  constructor(returnFormat = "application/json") {
    super({
      baseUrl: `${window.location.origin}/server/level-editor/`,
      headers: { Accept: returnFormat },
    });
  }

  get client() {
    return {
      browse: (dir, type) => this.get(`browse.php?dir=${encodeURIComponent(dir)}&type=${type}`),
      glob: (filepaths) =>
        this.get(`glob.php?entity_filepaths=${encodeURIComponent(JSON.stringify(filepaths))}`),
      save: (data) => this.post(`save.php`, data),
      file: (path) => this.get(path),
    };
  }
}
