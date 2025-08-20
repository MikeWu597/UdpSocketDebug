const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// console输出乱码

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Required to allow require() in renderer
        },
        defaultEncoding: 'utf-8'
    });

    win.loadFile('src/pages/index.html');
    win.setMenuBarVisibility(false);
    win.webContents.openDevTools();
    const cssPath = path.join(__dirname, 'src', 'pages', 'css', 'bootstrap.min.css');
    const jsPath = path.join(__dirname, 'src', 'pages', 'js', 'bootstrap.bundle.min.js');
    if (fs.existsSync(cssPath)) {
        win.webContents.insertCSS(fs.readFileSync(cssPath, 'utf8'));
    }   else {
        console.error('CSS file not found');
    }
    

    if (fs.existsSync(jsPath)) {
        win.webContents.executeJavaScript(fs.readFileSync(jsPath, 'utf8'));
    } else {
        console.error('JavaScript file not found');
    }
    
    passMainWindow(win);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
  
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
});

const { startUdpServer, passMainWindow } = require('./src/services/ipcHandlers');
startUdpServer();
