document.addEventListener("jsxLoaded", (e) => {
  console.log("JSX files loaded:", e.detail);
  updateCompInfo();
  setupEventHandlers();
});

function setupEventHandlers() {
  document.querySelectorAll(".update-composition-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      updateCompInfo();
    });
  });

  document
    .getElementById("refreshCompositionBtn")
    .addEventListener("click", () => {
      btn.classList.remove("spinning");
      void btn.offsetWidth;
      btn.classList.add("spinning");
      setTimeout(() => btn.classList.remove("spinning"), 700);
    });

  document
    .getElementById("exportSpriteSheet")
    .addEventListener("click", async () => {
      const outputPath = await chooseOutputFolder();

      if (!outputPath) {
        console.log("No output path selected, aborting render.");
        return;
      }

      const prefix = "frame_[#####]";

      evalScript(
        `renderCompFrames("${outputPath}", "${prefix}")`,
        function (result) {
          try {
            const res = JSON.parse(result);
            if (res.success) {
              console.log("Render completed successfully:", res);
            } else {
              console.error("Render failed:", res.error);
            }
          } catch (e) {
            console.error("Error parsing render result:", e);
          } finally {
            cleanup();
          }
        }
      );
    });
}

function cleanup() {
  evalScript(
    `deleteExportedFrames(${JSON.stringify(outputPath)}, ${JSON.stringify(
      prefix
    )})`,
    function (result) {
      try {
        const res = JSON.parse(result);
        console.log("Delete result:", res);
        if (res) {
          console.log("Deleted previous frames successfully:", res);
        } else {
          console.error("Failed to delete previous frames.");
        }
      } catch (e) {
        console.error("Error parsing delete result:", e);
      }
    }
  );
}

function updateCompInfo() {
  evalScript("getActiveCompInfo()", function (result) {
    try {
      const comp = JSON.parse(result);
      if (!comp) {
        document.getElementById("no-comp-panel").hidden = false;
        document.getElementById("comp-details-panel").hidden = true;
        return;
      }

      document.getElementById("no-comp-panel").hidden = true;
      document.getElementById("comp-details-panel").hidden = false;

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

async function chooseOutputFolder() {
  try {
    const outputPath = await new Promise((resolve, reject) => {
      csInterface.evalScript(
        `var folder = Folder.selectDialog("Choose output directory");
         folder ? folder.fsName : null;`,
        (result) => {
          if (result === "null" || result === null) {
            resolve(null); // User cancelled
          } else {
            resolve(result);
          }
        }
      );
    });

    if (outputPath) {
      console.log("Selected folder:", outputPath);
      return outputPath;
    } else {
      console.log("User cancelled folder selection");
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
