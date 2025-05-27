function deleteExportedFrames(outputPath, prefix, format) {
  try {
    var folder = new Folder(outputPath);
    if (!folder.exists)
      return JSON.stringify({
        result: false,
        error: "Output folder does not exist.",
      });

    var fileMask = prefix.replace(/\[#+\]/g, "*") + format;
    var files = folder.getFiles(fileMask);

    for (var i = 0; i < files.length; i++) {
      files[i].remove();
    }
    return JSON.stringify({ result: true, deletedFiles: files.length });
  } catch (e) {
    return JSON.stringify({
      result: false,
      error: e.message,
    });
  }
}
