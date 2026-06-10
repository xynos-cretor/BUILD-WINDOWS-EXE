const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const PORT = 3000;
let mainWindow = null;
let serverProcess = null;
let serverErrors = [];

// app.getAppPath() = path to app.asar (or app folder in dev)
// __dirname inside asar = virtual path — use appPath instead for file resolution
function appRoot() {
  return app.getAppPath();
}

// ─── Find node.exe ────────────────────────────────────────────────────────────
// process.execPath = Electron binary — NOT node. We need real node to run server.
function getNodePath() {
  if (app.isPackaged) {
    // Check if node.exe was bundled alongside the app
    const bundled = path.join(process.resourcesPath, 'node.exe');
    if (fs.existsSync(bundled)) return bundled;
  }
  return process.platform === 'win32' ? 'node.exe' : 'node';
}

// ─── Find server.cjs (in resources/, outside asar) ───────────────────────────
function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server.cjs');
  }
  return path.join(appRoot(), 'dist', 'server.cjs');
}

// ─── Find dist/ (React build, in resources/dist/) ────────────────────────────
function getDistPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dist');
  }
  return path.join(appRoot(), 'dist');
}

// ─── preload.js path — must come from unpacked location ──────────────────────
function getPreloadPath() {
  if (app.isPackaged) {
    // asarUnpack puts electron/ into app.asar.unpacked/electron/
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.js');
  }
  return path.join(appRoot(), 'electron', 'preload.js');
}

// ─── DB in user AppData (persists across updates) ────────────────────────────
function getDbPath() {
  return path.join(app.getPath('userData'), 'erp.db');
}

// ─── Start Express/SQLite backend ─────────────────────────────────────────────
function startServer() {
  const serverPath = getServerPath();
  const nodePath   = getNodePath();
  const distPath   = getDistPath();
  const dbPath     = getDbPath();

  if (!fs.existsSync(serverPath)) {
    dialog.showErrorBox(
      'Server Not Found',
      'server.cjs missing:\n' + serverPath + '\n\nPlease reinstall the application.'
    );
    app.quit();
    return;
  }

  console.log('Node  :', nodePath);
  console.log('Server:', serverPath);
  console.log('Dist  :', distPath);
  console.log('DB    :', dbPath);

  serverProcess = spawn(nodePath, [serverPath], {
   env: Object.assign({}, process.env, {
  NODE_ENV: 'production',
  PORT: String(PORT),
  DB_PATH: dbPath,
  DIST_PATH: distPath,
 NODE_PATH: path.join(
  process.resourcesPath,
  'app.asar.unpacked',
  'node_modules'
  )
}),
    cwd: app.isPackaged ? process.resourcesPath : appRoot(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', function(d) {
    console.log('[SERVER]', d.toString().trim());
  });
  serverProcess.stderr.on('data', function(d) {
    var msg = d.toString().trim();
    console.error('[SERVER ERR]', msg);
    serverErrors.push(msg);
  });
  serverProcess.on('exit', function(code) {
    console.log('[SERVER] exit code:', code);
  });
}

// ─── Poll until Express is ready ─────────────────────────────────────────────
function waitForServer(retries) {
  if (retries === undefined) retries = 40;
  var req = http.get('http://localhost:' + PORT + '/api/companies', function(res) {
    createWindow();
  });
  req.on('error', function() {
    if (retries > 0) {
      setTimeout(function() { waitForServer(retries - 1); }, 600);
    } else {
      var errDetail = serverErrors.slice(-8).join('\n') || 'No details captured.';
      dialog.showErrorBox(
        'Startup Error',
        'Server failed to start.\n\nError details:\n' + errDetail + '\n\nTip: Make sure port 3000 is not in use.'
      );
      app.quit();
    }
  });
  req.setTimeout(500, function() { req.destroy(); });
}

// ─── Create the app window ────────────────────────────────────────────────────
function createWindow() {
  var preloadPath = getPreloadPath();
  console.log('Preload:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Nexus ERP Pro',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadURL('http://localhost:' + PORT);

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.webContents.setWindowOpenHandler(function(details) {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', function() { mainWindow = null; });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(function() {
  startServer();
  setTimeout(function() { waitForServer(40); }, 800);

  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', function() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
