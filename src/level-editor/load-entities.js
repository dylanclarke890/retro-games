async function loadEntities(config) {
  const apiClient = new LevelEditorApiClient();
  return await apiClient.client.glob(config.project.entityFiles);
}

function loadScript({ src, cb = (_e, _path) => {} } = {}) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.addEventListener("load", (e) => cb(e, src));
  script.src = src;
}

function loadEntityScripts(entityObj) {
  const cb = (_e, filepath) => {
    console.log(`Loaded:${filepath}`);
  };
  Object.keys(entityObj).forEach((filepath) => loadScript({ src: filepath, cb }));
}

loadEntities(levelEditorConfig).then((val) => loadEntityScripts(val));
