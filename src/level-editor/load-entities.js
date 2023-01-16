async function loadEntities(config) {
  const apiClient = new LevelEditorApiClient();
  return await apiClient.client.glob(config.project.entityFiles);
}

function loadEntityScripts(entityObj) {
  Object.keys(entityObj).forEach((filepath) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.addEventListener("load", (_e) => {
      console.log(`Loaded:${filepath}`);
    });
    document.head.append(script);
    script.src = filepath;
  });
}

loadEntities(levelEditorConfig).then((val) => loadEntityScripts(val));
