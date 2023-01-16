async function loadEntities(config) {
  const apiClient = new LevelEditorApiClient();
  return await apiClient.client.glob(config.project.entityFiles);
}
