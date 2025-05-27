const fs = require("fs");
const path = require("path");

let currentNumFrames = 0;

// --- Initialization ---
document.addEventListener("jsxLoaded", (e) => {
  console.log("JSX files loaded:", e.detail);
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
}

async function handleExportSpriteSheet() {
  // const outputPath = await chooseOutputFolder();
  const outputPath = "/Users/matejvukosav/Desktop/ae/1";

  if (!outputPath) {
    console.log("No output path selected, aborting render.");
    return;
  }

  const prefix = "frame_[#####]";
  const format = ".png";

  evalScript(
    `renderCompFrames("${outputPath}", "${prefix}", "${format}")`,
    async (result) => {
      try {
        const res = JSON.parse(result);
        if (res.success) {
          console.log("Render completed successfully:", res);

          await createSpritesheetNode(
            outputPath + "/" + prefix,
            0,
            currentNumFrames - 1,
            outputPath,
            format
          );
        } else {
          console.error("Render failed:", res.error);
        }
      } catch (e) {
        console.error("Error parsing render result:", e);
      } finally {
        cleanup(outputPath, prefix);
      }
    }
  );
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

async function createSpritesheetNode(
  pattern,
  startFrame,
  endFrame,
  outputPath,
  format
) {
  const framePaths = generateFrameFilenames(
    pattern,
    startFrame,
    endFrame,
    format
  );
  const images = await Promise.all(framePaths.map(loadImage));

  const totalFrames = images.length;
  if (totalFrames === 0) throw new Error("No images loaded for spritesheet.");

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
function cleanup(outputPath, prefix) {
  evalScript(
    `deleteExportedFrames(${JSON.stringify(outputPath)}, ${JSON.stringify(
      prefix
    )})`,
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
