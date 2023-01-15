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
    return undefined;
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

class LevelEditorApiClient extends HttpClient {
  constructor(returnFormat = "application/json") {
    super({ baseUrl: "https://replacethis.com/api", headers: { Accept: returnFormat } });
  }

  get client() {
    const base = "/";
    return {
      browse: () => this.get(`${base}browse.php`),
      glob: () => this.get(`${base}glob.php`),
      save: (data) => this.post(`${base}save.php`, data),
    };
  }
}
