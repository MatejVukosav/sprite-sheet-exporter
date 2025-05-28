# 🎞️ After Effects Sprite Sheet Exporter

A lightweight CEP extension for Adobe After Effects that exports the active composition into a sprite sheet (`PNG` or `WebP`) with a corresponding `JSON` map describing each frame's position and size.

## ✨ Features

- 🔍 Load active composition info
- 📤 Export composition as a sprite sheet
- 💾 Prompt user for save location
- 🎨 Convert the active comp into a PNG sequence and stitch it into a single image using HTML `canvas`
- 🧮 Auto-calculate optimal canvas size based on frame count and dimensions
- 📝 Output both sprite sheet image and JSON data to disk
- 🐞 Live debug logs for process visibility
- 🖼️ Supports both `PNG` and `WebP` spritesheet formats
- 📈 Progress bar with real-time feedback during export
- ⚙️ Zero third-party dependencies

## 📸 Showcase

https://github.com/user-attachments/assets/bb235276-e87c-4c7a-9b3a-c4766e67b44a

## 🧩 Technical Components

- Adobe ExtendScript (JSX)
- Node.js Integration
- UI with CEP (Common Extensibility Platform)

## Project structure

```code
├── client  # CEP panel frontend
│   └── CSInterface.js
│   └── ext.js
│   └── index.html
│   └── index.js
│   └── style.css
├── CSXS
│   └── manifest.xml # CEP manifest file
├── host   # ExtendScript (.jsx) files
│   └── cleanExportedFrames.jsx
│   └── compositionInfo.jsx
│   └── index.jsx
│   └── openFolder.jsx
│   └── renderFrames.jsx
├── .debug   # Debug configuration
```

## 📦 Composition Metadata

- Name
- Width (px)
- Height (px)
- Frame Rate (fps)
- Total Frames
- Duration (s)

## 📦 JSON Format Example

Each frame's coordinates and dimensions are recorded in the exported JSON:

```json
{
  "frames": [
    {
      "x": 0,
      "y": 0,
      "width": 1024,
      "height": 1024
    }
  ]
}
```

## 🚀 Getting started

1. Clone repository

   ```bash
   git clone git@github.com:MatejVukosav/sprite-sheet-exporter.git
   ```

2. Move to Adobe CEP extensions directory

   ```bash
   sudo mv sprite-sheet-exporter "/Library/Application Support/Adobe/CEP/extensions/"
   ```

3. Open After Effects

   Navigate to: Window → Extensions → Sprite Sheet Exporter

## 🛠️ Debugging

### 🔄 Auto refresh Panel

Uncomment the following line in `client/index.html` to enable manual refresh during development:

```code
<!-- <a href="javascript:history.go(0)" style="color: white">Refresh panel</a> -->
```

### Script Loading Feedback

Logs indicate successful script loading:

```bash
✅ cleanExportedFrames script loaded successfully
❌ Issue while loading compositionInfo script
```

### 🌐 Access During Dev

Access the extension UI in the browser by navigating to: `http://localhost:8083`

### Load example composition

Install LottieFiles extension by navigating to Window → Find Extensions on Exchange

1. Search for `LottieFiles for After Effects`
2. Open LottieFiles extension in Adobe Effects; Window → Extensions → LottieFiles
3. Select one of existing components from `Explore` tab

## 📄License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
