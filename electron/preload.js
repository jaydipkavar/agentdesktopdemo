const { contextBridge, ipcRenderer } = require('electron');
// const Store = require('electron-store');

contextBridge.exposeInMainWorld("electronAPI", {
    ping: (msg) => ipcRenderer.send("ping", msg),
    onPong: (callback) =>
        ipcRenderer.on("pong", (_, response) => callback(response)),
    launchPlaywright: (url) => ipcRenderer.invoke("launch-playwright", url),
    captureScreenshot: () => ipcRenderer.invoke("capture-screenshot"),
    getPageContent: () => ipcRenderer.invoke("getPageContent"),
    performAction: (actionObj) =>
        ipcRenderer.invoke("performAction", actionObj),
    performActionNew: (actionObj) =>
        ipcRenderer.invoke("performActionNew", actionObj),
    closePlaywright: () => ipcRenderer.invoke("close-playwright"),
    waitForPage: () => ipcRenderer.invoke("waitForPage"),
    setViewportSize: (viewport) =>
        ipcRenderer.invoke("set-viewport-size", viewport),
    onUpdateAvailable: (callback) => ipcRenderer.on("update_available", (_event, value) => callback(value)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on("update_not_available", (_event, value) => callback(value)),
    onUpdateError: (callback) => ipcRenderer.on("update_error", (_event, value) => callback(value)),
    onDownloadProgress: (callback) => ipcRenderer.on("download_progress", (_event, value) => callback(value)),
    onUpdateDownloaded: (callback) => ipcRenderer.on("update_downloaded", (_event, value) => callback(value)),
});

contextBridge.exposeInMainWorld('api', {
  fetch: (url, options) => ipcRenderer.invoke('api-fetch', url, options),
});

// const store = new Store();

// // Export storageAPI for ipcRenderer usage (optional, for direct import in renderer process)
// const storageAPI = {
//   set: (key, value) => store.set(key, value),
//   get: (key) => store.get(key),
//   clear: () => store.clear(),
// };

// // Expose storageAPI via contextBridge
// contextBridge.exposeInMainWorld('storageAPI', storageAPI);
