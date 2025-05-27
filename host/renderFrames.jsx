function renderCompFrames(outputPath, prefix) {
  var renderQueueItem;
  try {
    var comp = app.project.activeItem;

    if (!comp || !(comp instanceof CompItem)) {
      alert("No active composition found.");
      return JSON.stringify({
        success: false,
      });
    }

    while (app.project.renderQueue.numItems > 0) {
      app.project.renderQueue.item(1).remove();
    }

    var renderQueue = app.project.renderQueue;
    renderQueueItem = renderQueue.items.add(comp);
    var outputModule = renderQueueItem.outputModules[1];

    //Exporting TIFF is much faster than PNG
    outputModule.applyTemplate("TIFF Sequence with Alpha");

    outputModule.file = new File(outputPath + "/" + prefix, +".tif");
    renderQueue.render();

    // // Poll for completion (prevents blocking)
    var maxWait = 300; // 5 minutes max (300 seconds)
    var startTime = new Date().getTime();

    while (app.project.renderQueue.isRendering) {
      $.sleep(500); // Check every 0.5 seconds
      if ((new Date().getTime() - startTime) / 1000 > maxWait) {
        throw new Error("Render timed out after 5 minutes");
      }
    }

    if (app.project.renderQueue.items[1].status === RQItemStatus.DONE) {
      alert("Render succeeded!");
    } else {
      alert("Render failed: " + app.project.renderQueue.items[1].status);
    }

    return JSON.stringify({
      success: true,
    });
  } catch (e) {
    alert("Error during rendering: " + e.message);
    return JSON.stringify({
      success: false,
      error: e.message,
    });
  } finally {
    if (renderQueueItem) {
      renderQueueItem.remove();
    }
  }
}
