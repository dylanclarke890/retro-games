export class HttpClient {
  /** @type {string} */
  #baseUrl;
  /** @type {Array<string>} */
  #headers;

  constructor({ baseUrl = "", headers = {} } = {}) {
    this.#baseUrl = baseUrl;
    this.#headers = headers;
  }

  async #doRequest(endpoint, opts = {}) {
    const res = await fetch(this.#baseUrl + endpoint, {
      ...opts,
      headers: this.#headers,
    });
    if (!res.ok) throw new Error(res.statusText);
    if (res.status === 204) return undefined;

    if (opts.parseResponse === false) return res.text();
    return res.json();
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
    return this.#doRequest(endpoint, {
      ...opts,
      method: "GET",
    });
  }

  post(endpoint, body, opts = {}) {
    if (body && opts.stringify !== false) body = JSON.stringify(body);
    return this.#doRequest(endpoint, {
      ...opts,
      body,
      method: "POST",
    });
  }

  put(endpoint, body, opts = {}) {
    if (body && opts.stringify !== false) body = JSON.stringify(body);
    return this.#doRequest(endpoint, {
      ...opts,
      body,
      method: "PUT",
    });
  }

  patch(endpoint, operations, opts = {}) {
    return this.#doRequest(endpoint, {
      parseResponse: false,
      ...opts,
      body: JSON.stringify(operations),
      method: "PATCH",
    });
  }

  delete(endpoint, opts = {}) {
    return this.#doRequest(endpoint, {
      parseResponse: false,
      ...opts,
      method: "DELETE",
    });
  }
}

export class LevelEditorHttpClient extends HttpClient {
  constructor(returnFormat = "application/json") {
    super({
      baseUrl: `${window.location.origin}/server/level-editor/`,
      headers: { Accept: returnFormat },
    });
  }

  get api() {
    return {
      browse: (dir, type, opts = {}) =>
        this.get(`browse.php?dir=${encodeURIComponent(dir)}&type=${type}`, opts),
      glob: (filepaths, opts = {}) =>
        this.get(
          `glob.php?entity_filepaths=${encodeURIComponent(JSON.stringify(filepaths))}`,
          opts
        ),
      save: (path, data, opts = {}) =>
        this.post(`save.php?path=${encodeURIComponent(path)}`, data, { ...opts, stringify: false }),
      file: (path, opts = {}) => this.get(`../../${path}`, opts),
    };
  }
}
