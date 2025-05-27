const csInterface = new CSInterface();

function loadJSX() {
  csInterface.evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/renderFrames.jsx")`,
    function (result) {
      console.log("Render result:", result);
    }
  );

  csInterface.evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/cleanExportedFrames.jsx")`,
    function (result) {
      console.log("Delete result:", result);
    }
  );

  csInterface.evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/compositionInfo.jsx")`,
    function (result) {
      console.log("Composition info result:", result);
    }
  );

  document.dispatchEvent(new CustomEvent("jsxLoaded"));
}

function evalScript(script, callback) {
  csInterface.evalScript(script, callback);
}

function onLoaded() {
  loadJSX();
}
