"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const appName = electron_1.app.getPath('exe');
const expressAppUrl = 'http://127.0.0.1:3000';
let mainWindow;
console.log('log', __dirname);
function redirectOutput(x) {
    x.on('data', function (data) {
        data
            .toString()
            .split('\n')
            .forEach((line) => {
            if (line !== '') {
                // regex from: http://stackoverflow.com/a/29497680/170217
                // REGEX to Remove all ANSI colors/styles from strings
                let serverLogEntry = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                mainWindow.webContents.send('server-log-entry', serverLogEntry);
            }
        });
    });
}
function registerGlobalShortcuts() {
    electron_1.globalShortcut.register('CommandOrControl+Shift+L', () => {
        mainWindow.webContents.send('show-server-log');
    });
}
function createWindow() {
    const expressAppProcess = (0, child_process_1.spawn)(appName, [path_1.default.join(__dirname, 'express-app.js')], {
        env: {
            ELECTRON_RUN_AS_NODE: '1',
        },
    });
    redirectOutput(expressAppProcess.stdout);
    redirectOutput(expressAppProcess.stderr);
    mainWindow = new electron_1.BrowserWindow({
        autoHideMenuBar: true,
        width: 1024,
        height: 780,
        icon: path_1.default.join(__dirname, path_1.default.join('..', 'favicon.ico')),
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            devTools: false,
        },
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        expressAppProcess.kill();
    });
    mainWindow.on('focus', () => {
        registerGlobalShortcuts();
    });
    mainWindow.on('blur', () => {
        electron_1.globalShortcut.unregisterAll();
    });
    electron_1.ipcMain.handle('get-express-app-url', () => {
        return expressAppUrl;
    });
    //mainWindow.webContents.openDevTools();
    mainWindow.loadURL(`file://${__dirname}/../index.html`);
}
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.whenReady().then(() => {
    registerGlobalShortcuts();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    let checkServerRunning = setInterval(() => {
        (0, node_fetch_1.default)(expressAppUrl)
            .then((response) => {
            if (response.status === 200) {
                clearInterval(checkServerRunning);
                mainWindow.webContents.send('server-running');
            }
        })
            .catch((err) => {
            // swallow exception
        });
    }, 1000);
});
