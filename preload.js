const {
  contextBridge,
  ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
    setupDone: () => ipcRenderer.invoke("setup-done"),
    getPlugins: () => ipcRenderer.invoke("get-plugins"),
    selectXLivebgPath: () => ipcRenderer.invoke("select-xlivebg-path"),
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ["select-plugin", "save-xlivebg-path"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ["get-plugins"];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);
