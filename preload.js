// Preload runs in renderer with access to Node APIs before page loads.
// Keep this minimal — only expose what the renderer actually needs.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
});
