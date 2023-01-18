async function loadEntities(config) {
  const apiClient = new LevelEditorApi();
  return await apiClient.client.glob(config.project.entityFiles);
}

function loadScript({ src, cb = (_e, _path) => {} } = {}) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.addEventListener("load", (e) => cb(e, src));
  script.src = src;
}

function loadEntityScripts(entitiesObj) {
  const cb = (_e, filepath) => {
    console.log(`Loaded: ${filepath}`);
  };
  Object.keys(entitiesObj).forEach((filepath) => loadScript({ src: filepath, cb }));
}

loadEntities(levelEditorConfig).then((entitiesObj) => loadEntityScripts(entitiesObj));
