function openFolder(path) {
  var folder = new Folder(path);
  if (folder.exists) {
    folder.execute();
    return true;
  } else {
    return false;
  }
}
