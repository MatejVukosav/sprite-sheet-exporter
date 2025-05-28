function renderCompFrames(outputPath, prefix, format) {
  var renderQueueItem;
  var undoGroupStarted = false;

  try {
    var comp = app.project.activeItem;

    if (!comp || !(comp instanceof CompItem)) {
      alert("No active composition found.");
      return JSON.stringify({
        success: false,
      });
    }

    app.beginUndoGroup("Add PNG Sequence to Render Queue");
    undoGroupStarted = true;

    var renderQueue = app.project.renderQueue;
    renderQueueItem = renderQueue.items.add(comp);
    var outputModule = renderQueueItem.outputModules[1];
    outputModule.file = new File(outputPath + "/" + prefix + format);

    //https://github.com/TelegramMessenger/bodymovin-extension/blob/e35d611d1a67f9e6ebf2fecd4fc322447a05927a/bundle/jsx/utils/sourceHelper.jsx#L196
    outputModule.applyTemplate("_HIDDEN X-Factor 8 Premul");

    renderQueue.render();

    return JSON.stringify({
      success: true,
    });
  } catch (e) {
    return JSON.stringify({
      success: false,
      error: e.message,
    });
  } finally {
    if (undoGroupStarted) {
      app.endUndoGroup();
    }
    if (renderQueueItem) {
      renderQueueItem.remove();
    }
  }
}

function isRenderRunning() {
  return JSON.stringify({ isRendering: app.project.renderQueue.isRendering });
}
