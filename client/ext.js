const csInterface = new CSInterface();

function loadJSX() {
  evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/renderFrames.jsx")`,
    function (result) {
      if (result === "undefined") {
        console.log("renderFrames script loaded successfully");
      } else {
        console.log("Issue while loading renderFrames script");
      }
    }
  );

  evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/cleanExportedFrames.jsx")`,
    function (result) {
      if (result === "undefined") {
        console.log("cleanExportedFrames script loaded successfully");
      } else {
        console.log("Issue while loading cleanExportedFrames script");
      }
    }
  );

  evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/compositionInfo.jsx")`,
    function (result) {
      if (result === "undefined") {
        console.log("compositionInfo script loaded successfully");
      } else {
        console.log("Issue while loading compositionInfo script");
      }
    }
  );

  evalScript(
    `$.evalFile("${csInterface.getSystemPath(
      SystemPath.EXTENSION
    )}/host/openFolder.jsx")`,
    function (result) {
      if (result === "undefined") {
        console.log("openFolder script loaded successfully");
      } else {
        console.log("Issue while loading openFolder script");
      }
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
