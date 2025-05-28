const fs = require("fs");
const path = require("path");

let currentNumFrames = 0;

// --- Initialization ---
document.addEventListener("jsxLoaded", (e) => {
  updateCompInfo();
  setupEventHandlers();
});

// --- Event Handlers ---
function setupEventHandlers() {
  document.querySelectorAll(".update-composition-btn").forEach((btn) => {
    btn.addEventListener("click", updateCompInfo);
  });

  const refreshBtn = document.getElementById("refreshCompositionBtn");
  refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.remove("spinning");
    void refreshBtn.offsetWidth; // Trigger reflow to restart animation
    refreshBtn.classList.add("spinning");
    setTimeout(() => refreshBtn.classList.remove("spinning"), 700);
  });

  document
    .getElementById("exportSpriteSheet")
    .addEventListener("click", handleExportSpriteSheet);

  const toggleBtn = document.getElementById("toggleLogsBtn");
  const logContainer = document.getElementById("logContainer");
  let logsVisible = false;

  toggleBtn.addEventListener("click", () => {
    logsVisible = !logsVisible;
    if (logsVisible) {
      logContainer.style.display = "block";
      toggleBtn.textContent = "Hide Logs";
    } else {
      logContainer.style.display = "none";
      toggleBtn.textContent = "Show Logs";
    }
  });
}

async function handleExportSpriteSheet() {
  document.getElementById("exportSpriteSheet").disabled = true;
  const outputPath = await chooseOutputFolder();

  if (!outputPath) {
    console.log("No output path selected, aborting render.");
    return;
  }

  const prefix = "frame_[#####]";
  const format = ".png";

  await showProgressBar();
  await updateProgressBar(20);

  evalScript(
    `renderCompFrames("${outputPath}", "${prefix}", "${format}")`,
    async (result) => {
      await processRender(result, outputPath, prefix, format);
    }
  );
}

async function processRender(result, outputPath, prefix, format) {
  try {
    const res = JSON.parse(result);
    if (res.success) {
      console.log("Render completed successfully:", res);
      await updateProgressBar(50);

      await createSpritesheet(
        outputPath + "/" + prefix,
        0,
        currentNumFrames - 1,
        outputPath,
        format
      );
      await updateProgressBar(100);
      evalScript(
        `openFolder(${JSON.stringify(outputPath)})`,
        function (result) {
          if (result === "true") {
            console.log("Folder opened!");
          } else {
            console.error("Folder not found!");
          }
        }
      );
    } else {
      console.error("Render failed:", res.error);
      hideProgressBar();
    }
  } catch (e) {
    console.error("Error parsing render result:", e);
    hideProgressBar();
  } finally {
    cleanup(outputPath, prefix, format);
    setTimeout(hideProgressBar, 500);
    document.getElementById("exportSpriteSheet").disabled = false;
  }
}

// --- Composition Info ---
function updateCompInfo() {
  evalScript("getActiveCompInfo()", (result) => {
    try {
      const comp = JSON.parse(result);

      const noCompPanel = document.getElementById("no-comp-panel");
      const compDetailsPanel = document.getElementById("comp-details-panel");

      if (!comp) {
        noCompPanel.hidden = false;
        compDetailsPanel.hidden = true;
        return;
      }

      noCompPanel.hidden = true;
      compDetailsPanel.hidden = false;

      currentNumFrames = comp.numFrames || 0;

      console.log("Active Composition Info:", comp);
      updateCompDetails({
        name: comp.name,
        width: comp.width,
        height: comp.height,
        frameRate: comp.frameRate.toFixed(2),
        duration: comp.duration.toFixed(2),
        numFrames: currentNumFrames,
      });
    } catch (e) {
      console.error("Error parsing composition info:", e);
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
  document.getElementById("comp-width").textContent = `${width} px`;
  document.getElementById("comp-height").textContent = `${height} px`;
  document.getElementById("comp-framerate").textContent = `${frameRate} fps`;
  document.getElementById("comp-duration").textContent = `${duration} s`;
  document.getElementById("comp-numFrames").textContent = numFrames;
}

// --- Spritesheet Generation ---
function generateFrameFilenames(pattern, start, end, ext) {
  const files = [];
  for (let i = start; i <= end; i++) {
    const frameNum = i.toString().padStart(5, "0");
    files.push(pattern.replace("[#####]", frameNum) + ext);
  }
  return files;
}

async function createSpritesheet(
  pattern,
  startFrame,
  endFrame,
  outputPath,
  format
) {
  console.log("Creating spritesheet");
  const framePaths = generateFrameFilenames(
    pattern,
    startFrame,
    endFrame,
    format
  );

  let loadedImages = 0;
  // Load images with progress update
  const images = [];
  let lastReportedProgress = 50;
  for (const framePath of framePaths) {
    const img = await loadImage(framePath);
    images.push(img);

    loadedImages++;
    var progress = 50 + Math.floor((loadedImages / framePaths.length) * 40);
    // Only update progress bar if progress advanced by at least 5%
    if (
      progress >= lastReportedProgress + 5 ||
      loadedImages === framePaths.length - 1
    ) {
      lastReportedProgress = progress;
      await updateProgressBar(progress);
    }
  }

  const totalFrames = images.length;
  if (totalFrames === 0) {
    throw new Error("No images loaded for spritesheet.");
  }

  const { width: originalWidth, height: originalHeight } = images[0];

  // Calculate grid layout (square-like)
  const cols = Math.ceil(Math.sqrt(totalFrames));
  const rows = Math.ceil(totalFrames / cols);

  const maxCanvasSize = detectMaxCanvasSize();
  console.log("Detected max canvas size:", maxCanvasSize);

  let scale = 1;
  let frameWidth = originalWidth;
  let frameHeight = originalHeight;

  // Scale down if needed to fit max canvas size
  while (
    frameWidth * cols > maxCanvasSize ||
    frameHeight * rows > maxCanvasSize
  ) {
    scale -= 0.05;
    if (scale <= 0.05) throw new Error("Frames too large to fit in canvas.");
    frameWidth = Math.floor(originalWidth * scale);
    frameHeight = Math.floor(originalHeight * scale);
  }

  // Create canvas and draw spritesheet
  console.log("Create canvas and draw spritesheet");
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth * cols;
  canvas.height = frameHeight * rows;
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < totalFrames; i++) {
    const img = images[i];
    const x = (i % cols) * frameWidth;
    const y = Math.floor(i / cols) * frameHeight;

    ctx.drawImage(
      img,
      0,
      0,
      originalWidth,
      originalHeight,
      x,
      y,
      frameWidth,
      frameHeight
    );

    // Update progress bar 90% to 98%
    if (i % Math.ceil(totalFrames / 20) === 0 || i === totalFrames - 1) {
      const progress = 90 + Math.floor((i / (totalFrames - 1)) * 8);
      await updateProgressBar(progress);
    }
  }

  const spritesheetFileName = "spritesheet.png";
  const spritesheetPath = path.join(outputPath, spritesheetFileName);
  await saveCanvas(canvas, spritesheetPath);

  generateFrameData(
    frameWidth,
    frameHeight,
    totalFrames,
    cols,
    outputPath,
    spritesheetFileName
  );
}

// Save canvas as PNG file
function saveCanvas(canvas, outputPath) {
  console.log("Saving canvas to:", outputPath);
  return new Promise((resolve, reject) => {
    const dataURL = canvas.toDataURL("image/png");
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
    fs.writeFile(outputPath, base64Data, "base64", (err) => {
      if (err) reject(err);
      else {
        console.log(`Spritesheet saved to ${outputPath}`);
        resolve();
      }
    });
  });
}

// Detect max canvas size supported by browser
function detectMaxCanvasSize() {
  let size = 16384;
  const step = 1024;

  while (size > 0) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      if (canvas.getContext("2d")) {
        return size;
      }
    } catch {
      // ignore and try smaller size
    }
    size -= step;
  }
  return 0;
}

// Cleanup exported frames
function cleanup(outputPath, prefix, format) {
  evalScript(
    `deleteExportedFrames(${JSON.stringify(outputPath)}, ${JSON.stringify(
      prefix
    )},${JSON.stringify(format)})`,
    (result) => {
      try {
        const res = JSON.parse(result);
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

// Load image from local file path
async function loadImage(filePath) {
  const data = await fs.promises.readFile(filePath);
  const base64Data = data.toString("base64");
  const dataURL = `data:image/png;base64,${base64Data}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}

// Generate JSON data for frame info
function generateFrameData(
  width,
  height,
  frameCount,
  cols,
  outputPath,
  spritesheetFileName
) {
  console.log("Generating frame data JSON...");
  const data = {
    frames: [],
    meta: {
      image: spritesheetFileName,
      size: {
        w: width * cols,
        h: height * Math.ceil(frameCount / cols),
      },
    },
  };

  for (let i = 0; i < frameCount; i++) {
    data.frames.push({
      x: (i % cols) * width,
      y: Math.floor(i / cols) * height,
      width,
      height,
    });
  }

  const fileName = "spritesheet.json";

  fs.writeFileSync(
    path.join(outputPath, fileName),
    JSON.stringify(data, null, 2)
  );
  console.log("Generated frame data JSON at:", path.join(outputPath, fileName));
}

async function chooseOutputFolder() {
  try {
    const outputPath = await new Promise((resolve, reject) => {
      evalScript(
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

async function showProgressBar() {
  document.getElementById("progress-container").style.display = "block";
  await updateProgressBar(0);
}

function hideProgressBar() {
  document.getElementById("progress-container").style.display = "none";
}

async function updateProgressBar(percent) {
  const bar = document.getElementById("progress-bar");
  bar.style.width = `${percent}%`;
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

(function () {
  const originalLog = console.log;
  console.log = function (...args) {
    originalLog.apply(console, args);
    appendLog(args.map(formatArg).join(" "));
  };

  const originalError = console.error;
  console.error = function (...args) {
    originalError.apply(console, args);
    appendLog("ERROR: " + args.map(formatArg).join(" "));
  };

  // Helper to format arguments
  function formatArg(arg) {
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return "[object]";
      }
    }
    return String(arg);
  }
})();

function appendLog(message) {
  const logContainer = document.getElementById("logContainer");
  const time = new Date().toLocaleTimeString();
  const formattedMsg = `[${time}] ${message}`;
  const logEntry = document.createElement("div");
  logEntry.textContent = formattedMsg;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight; // scroll to bottom
}
