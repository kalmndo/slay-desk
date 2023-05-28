"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    getExpressAppUrl: () => electron_1.ipcRenderer.invoke("get-express-app-url")
});
electron_1.contextBridge.exposeInMainWorld("ipcRenderer", {
    on: (channel, listener) => {
        electron_1.ipcRenderer.on(channel, listener);
    }
});
