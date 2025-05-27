const csInterface = new CSInterface();

document.querySelectorAll(".update-composition-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    updateCompInfo();
  });
});

const btn = document.getElementById("refreshCompositionBtn");

btn.addEventListener("click", () => {
  
  // Remove class if already present to allow retriggering
  btn.classList.remove("spinning");
  // Force reflow to restart animation (important for repeated clicks)
  void btn.offsetWidth;
  btn.classList.add("spinning");
  // Remove class after animation completes (700ms)
  setTimeout(() => btn.classList.remove("spinning"), 700);
});

csInterface.evalScript(
  `$.evalFile("${csInterface.getSystemPath(
    SystemPath.EXTENSION
  )}/host/compositionInfo.jsx")`
);

// Update composition info on panel open
updateCompInfo();

function updateCompInfo() {
  csInterface.evalScript("getActiveCompInfo()", function (result) {
    try {
      const comp = JSON.parse(result);
      if (!comp) {
        document.getElementById("no-comp-panel").hidden = false;
        document.getElementById("comp-details-panel").style.display = "none";
        return;
      }

      document.getElementById("no-comp-panel").hidden = true;
      document.getElementById("comp-details-panel").style.display = "block";

      console.log("Active Composition Info:", comp);
      if (comp) {
        updateCompDetails({
          name: comp.name,
          width: comp.width,
          height: comp.height,
          frameRate: comp.frameRate.toFixed(2),
          duration: comp.duration.toFixed(2),
          numFrames: comp.numFrames,
        });
      }
    } catch (e) {
      console.log("errrorore", e);
      document.getElementById("no-comp-panel").hidden = false;
      document.getElementById("comp-details-panel").hidden = true;
    }
  });
}

function updateCompDetails({
  name,
  width,
  height,
  frameRate,
  duration,
  numFrames,
}) {
  document.getElementById("comp-name").textContent = name;
  document.getElementById("comp-width").textContent = width + " px";
  document.getElementById("comp-height").textContent = height + " px";
  document.getElementById("comp-framerate").textContent = frameRate + " fps";
  document.getElementById("comp-duration").textContent = duration + " s";
  document.getElementById("comp-numFrames").textContent = numFrames;
}
