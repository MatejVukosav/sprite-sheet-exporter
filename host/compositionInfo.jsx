function getActiveCompInfo() {
  try {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
      return JSON.stringify({
        name: comp.name,
        width: comp.width,
        height: comp.height,
        frameRate: comp.frameRate,
        duration: comp.duration,
        numFrames: Math.ceil(comp.duration * comp.frameRate),
      });
    }
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
  return JSON.stringify(null);
}
