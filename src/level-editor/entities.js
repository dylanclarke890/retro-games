// TODO

// Load the list of entity files via AJAX PHP glob
const path = wm.config.api.glob + "?",
  globs =
    typeof wm.config.project.entityFiles == "string"
      ? [wm.config.project.entityFiles]
      : wm.config.project.entityFiles;

for (let i = 0; i < globs.length; i++) {
  path += "glob[]=" + encodeURIComponent(globs[i]) + "&";
}

path += "nocache=" + Math.random();

// TODO
var req = $.ajax({
  url: path,
  method: "get",
  dataType: "json",
  success: function (files) {
    // File names to Module names
    const moduleNames = [];
    const modules = {};
    for (let i = 0; i < files.length; i++) {
      const name = files[i]
        .replace(new RegExp("^" + ig.lib + "|\\.js$", "g"), "")
        .replace(/\//g, ".");
      moduleNames.push(name);
      modules[name] = files[i];
    }
  },
  error: function (xhr, status, error) {
    throw "Failed to load entity list via glob.php: " + error + "\n" + xhr.responseText;
  },
});
