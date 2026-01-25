const { app, BrowserWindow, shell, Notification, Menu, ipcMain, Tray, globalShortcut, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
const { Bonjour } = require('bonjour-service');
const bonjour = new Bonjour();
const discoveredServers = new Map();

// Set Application Name for System Menus
app.setName('Koordinator');

// Windows Toast Notifications (required for packaged app)
if (process.platform === 'win32') {
    app.setAppUserModelId('ru.mil.coordinator');
}

// const __filename = fileURLToPath(import.meta.url); // Not needed in CJS
// const __dirname = path.dirname(__filename); // __dirname is available in CJS

let mainWindow;
let tray = null;

// Deep linking protocol
const PROTOCOL = 'gis-coordinator';
// Map to store active file watchers: filePath -> { fileId, watcher }
const fileWatchers = new Map();

// Certificate validation bypass ONLY in development mode
// In production, proper certificates must be used
if (process.env.NODE_ENV === 'development') {
    app.commandLine.appendSwitch('ignore-certificate-errors');
}

// Path validation helper to prevent path traversal attacks
const isPathSecure = (filePath, allowedBaseDir = null) => {
    const normalizedPath = path.normalize(filePath);

    // Prevent path traversal
    if (normalizedPath.includes('..')) {
        return false;
    }

    // Check for absolute paths trying to access system directories
    const dangerousPaths = ['/etc', '/usr', '/bin', '/sbin', '/var', '/root', '/home/root', 'C:\\Windows', 'C:\\Program Files'];
    for (const dangerous of dangerousPaths) {
        if (normalizedPath.toLowerCase().startsWith(dangerous.toLowerCase())) {
            return false;
        }
    }

    // If allowedBaseDir is specified, ensure path is within it
    if (allowedBaseDir) {
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(allowedBaseDir);
        return resolvedPath.startsWith(resolvedBase);
    }

    return true;
};

// Helper to get consistent icon path in dev and prod
const getIconPath = () => {
    const isWin = process.platform === 'win32';
    const ext = isWin ? 'ico' : 'png';
    const fileName = `icon.${ext}`;

    // In production, resources are often placed differently
    if (app.isPackaged) {
        // Try resource path (if using extraResources)
        const resourcePath = path.join(process.resourcesPath, fileName);
        if (fs.existsSync(resourcePath)) return resourcePath;

        // Fallback to png if ico not found
        if (isWin) {
            const pngResource = path.join(process.resourcesPath, 'icon.png');
            if (fs.existsSync(pngResource)) return pngResource;
        }

        // Try next to the main script (inside asar or dist)
        const mainDirIcon = path.join(__dirname, fileName);
        if (fs.existsSync(mainDirIcon)) return mainDirIcon;
    }

    // Default development path
    const devPath = path.join(__dirname, `../public/${fileName}`);
    if (fs.existsSync(devPath)) return devPath;

    // Final fallback to png in dev
    return path.join(__dirname, '../public/icon.png');
};

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient(PROTOCOL);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 800,
        minWidth: 1440,
        minHeight: 800,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            // webSecurity: true is the default and safer, but we might encounter issues with local file loading (file://).
            // However, to fix the warning and improve security, we should enable it.
            // If local files break, we will need to use a custom protocol or handle it via IPC.
            webSecurity: true,
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#ffffff',
        icon: getIconPath(),
        show: false, // Don't show the window until it's ready
    });

    // Ensure the size is set correctly when ready and show the window
    mainWindow.once('ready-to-show', () => {
        mainWindow.setSize(1440, 800);
        mainWindow.center();
        mainWindow.show();
    });

    const config = getConfig();
    if (config.serverUrl) {
        console.log('Loading server URL:', config.serverUrl);
        const appUrl = config.serverUrl.replace(/\/api$/, '') || config.serverUrl;
        mainWindow.loadURL(appUrl);
    } else {
        // Fallback to loader.html if no config
        mainWindow.loadFile(path.join(__dirname, 'loader.html'));
    }

    mainWindow.setMenu(null);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Enable standard shortcuts (Cmd+C, Cmd+V etc.)
    const template = [
        ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // On Windows/Linux, hide the menu bar by default but keep shortcuts active
    if (process.platform !== 'darwin') {
        mainWindow.setAutoHideMenuBar(true);
        mainWindow.setMenuBarVisibility(false);
    }

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    const iconPath = getIconPath();
    // In production we might not have fs.existsSync specific access if inside asar, 
    // but getIconPath tries to verify.
    // However, for Tray, passing a non-existent path usually doesn't throw but shows nothing.

    try {
        tray = new Tray(iconPath);
    } catch (e) {
        console.error("Failed to create tray:", e);
        return;
    }
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Открыть Координатор',
            accelerator: 'Alt+Shift+C',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: 'Быстрый поиск',
            accelerator: 'Alt+Shift+F',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('trigger-search');
            }
        },
        {
            label: 'Загрузить файл...',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
                mainWindow.webContents.send('trigger-upload');
            }
        },
        { type: 'separator' },
        {
            label: 'Настройки автозагрузки',
            submenu: [
                { label: 'Включить', type: 'radio', checked: app.getLoginItemSettings().openAtLogin, click: () => app.setLoginItemSettings({ openAtLogin: true }) },
                { label: 'Выключить', type: 'radio', checked: !app.getLoginItemSettings().openAtLogin, click: () => app.setLoginItemSettings({ openAtLogin: false }) }
            ]
        },
        { type: 'separator' },
        {
            label: 'Сбросить настройки сервера',
            click: () => {
                saveConfig({ serverUrl: '' });
                if (mainWindow) {
                    mainWindow.loadFile(path.join(__dirname, 'loader.html'));
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Выход',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('ГИС Координатор');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    // Global Shortcuts
    globalShortcut.register('Alt+Shift+C', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    globalShortcut.register('Alt+Shift+F', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('trigger-search');
        }
    });
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle deep linking for Windows/Linux
app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();

        const url = commandLine.pop();
        if (url.startsWith(`${PROTOCOL}://`)) {
            mainWindow.webContents.send('open-url', url);
        }
    }
});

// Deep linking for macOS
app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.webContents.send('open-url', url);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Helper to download and cache icons
async function downloadAndCacheIcon(url) {
    if (!url) return null;
    try {
        const cacheDir = path.join(app.getPath('userData'), 'avatar_cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const hash = crypto.createHash('md5').update(url).digest('hex');
        const ext = path.extname(url).split('?')[0] || '.png'; // Default to png if no ext
        const cachedPath = path.join(cacheDir, `${hash}${ext}`);

        if (fs.existsSync(cachedPath)) {
            return cachedPath;
        }

        const response = await fetch(url);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(cachedPath, buffer);

        return cachedPath;
    } catch (err) {
        console.error('Failed to download icon:', err);
        return null;
    }
}

// IPC listeners
ipcMain.on('show-notification', async (event, { title, body, icon, data, subtitle, actions, silent, iconUrl }) => {
    // Icon resolution strategy для уведомлений:
    let iconPath = undefined;

    // 1. Try remote icon first (Avatar)
    if (iconUrl) {
        iconPath = await downloadAndCacheIcon(iconUrl);
    }

    // 2. If no remote icon or download failed, try local icon
    if (!iconPath && icon) {
        // Remove leading slash for path joining
        const iconName = icon.replace(/^\//, '');

        if (app.isPackaged) {
            // In packaged app, we look in resources or dist
            const resourcePath = path.join(process.resourcesPath, iconName);
            if (fs.existsSync(resourcePath)) {
                iconPath = resourcePath;
            } else {
                const asarPath = path.join(__dirname, iconName);
                if (fs.existsSync(asarPath)) iconPath = asarPath;
            }
        } else {
            // In dev, we look in public or dist
            const publicPath = path.join(__dirname, '../public', iconName);
            if (fs.existsSync(publicPath)) {
                iconPath = publicPath;
            } else {
                const distPath = path.join(__dirname, '../dist', iconName);
                if (fs.existsSync(distPath)) iconPath = distPath;
            }
        }
    }

    // If no icon found from request, use app icon
    if (!iconPath) {
        iconPath = getIconPath();
    }

    const notification = new Notification({
        title,
        body,
        icon: iconPath,
        subtitle,
        silent,
        actions: actions ? actions.map(a => ({ type: 'button', text: a.title })) : undefined,
    });

    notification.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            if (data) {
                mainWindow.webContents.send('notification-clicked', data);
            }
        }
    });

    notification.on('action', (e, index) => {
        if (actions && actions[index] && mainWindow) {
            mainWindow.webContents.send('notification-action', {
                action: actions[index].action,
                data: data
            });
        }
    });

    notification.show();
});

ipcMain.on('focus-window', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});

ipcMain.on('load-app', (event, url) => {
    if (mainWindow && url) {
        const appUrl = url.replace(/\/api$/, '') || url;
        mainWindow.loadURL(appUrl);
    }
});

// mDNS Discovery logic
function startDiscovery() {
    const browser = bonjour.find({ type: 'koordinator', protocol: 'tcp' });

    browser.on('up', (service) => {
        console.log('Found Koordinator server:', service.name, service.addresses);
        const protocol = service.txt?.protocol || 'http';
        const hostname = service.txt?.domain || service.addresses[0];
        discoveredServers.set(service.name, {
            name: service.txt?.name || service.name,
            url: `${protocol}://${hostname}:${service.port}`,
            version: service.txt?.version || 'unknown',
            id: service.name
        });
        broadcastServers();
    });

    browser.on('down', (service) => {
        console.log('Server down:', service.name);
        discoveredServers.delete(service.name);
        broadcastServers();
    });
}

function broadcastServers() {
    if (mainWindow) {
        const servers = Array.from(discoveredServers.values());
        mainWindow.webContents.send('servers-discovered', servers);
    }
}

ipcMain.handle('discover-servers', () => {
    return Array.from(discoveredServers.values());
});

// Call discovery on startup
app.whenReady().then(() => {
    startDiscovery();
});

// Config Store
function getConfigPath() { return path.join(app.getPath('userData'), 'config.json'); }

function getConfig() {
    try {
        const configPath = getConfigPath();
        console.log('Reading config from:', configPath);
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            console.log('Config data read:', data);
            return JSON.parse(data);
        }
        console.log('No config file found');
    } catch (error) {
        console.error('Error reading config:', error);
    }
    return { serverUrl: '', downloadPath: '' };
}

function saveConfig(config) {
    try {
        const configPath = getConfigPath();
        const configDir = path.dirname(configPath);

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        const current = getConfig();
        const newConfig = { ...current, ...config };
        const data = JSON.stringify(newConfig, null, 2);

        console.log('Saving config to:', configPath);
        console.log('Config data to save:', data);

        fs.writeFileSync(configPath, data);
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
};

ipcMain.handle('get-app-config', async () => {
    return getConfig();
});

ipcMain.handle('save-app-config', async (event, config) => {
    return saveConfig(config);
});

ipcMain.handle('open-in-native-app', async (event, { url, fileName, fileId }) => {
    try {
        const config = getConfig();
        let downloadDir = config.downloadPath;

        // Fallback to temp dir if not configured or invalid
        if (!downloadDir || !fs.existsSync(downloadDir)) {
            downloadDir = path.join(os.tmpdir(), 'coordinator-files');
            if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
        }

        const filePath = path.join(downloadDir, fileName);

        // Download the file
        const response = await axios({
            url,
            // If the URL is relative, prepend the configured server URL (or default if available)
            // But usually the frontend sends a full URL or we handle it there.
            // Let's assume frontend sends a full URL or a relative one.
            // If relative, we need the base.
            // For now, assume 'url' passed from frontend is complete or the axios call works.
            // Wait, if frontend is dynamic, 'url' might be relative.
            // Let's check how frontend calls it.
            // Frontend: window.electron.openInNativeApp(previewUrl, ...)
            // previewUrl comes from getFileUrl which usually includes baseURL.
            // So we are safe.
            method: 'GET',
            responseType: 'stream',
            httpsAgent: new https.Agent({
                rejectUnauthorized: process.env.NODE_ENV !== 'development'
            })
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Open the file with native app
        await shell.openPath(filePath);

        // Start watching for changes if fileId is provided
        if (fileId && !fileWatchers.has(filePath)) {
            const watcher = fs.watch(filePath, (eventType) => {
                if (eventType === 'change') {
                    // Notify renderer that file was modified
                    // Debounce might be needed, but renderer can handle it too
                    event.sender.send('file-modified', { fileId, filePath, fileName });
                }
            });
            fileWatchers.set(filePath, { fileId, watcher });

            // Cleanup watcher if file is deleted or app closes (simplified here)
            watcher.on('close', () => fileWatchers.delete(filePath));
        }

        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error opening file in native app:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.on('show-context-menu', (event, items) => {
    const template = items.map(item => {
        if (item.type === 'separator') return { type: 'separator' };
        return {
            label: item.label,
            role: item.role,
            enabled: item.enabled !== false,
            click: () => { event.sender.send('context-menu-command', item.id) }
        };
    });
    const menu = Menu.buildFromTemplate(template);
    const win = BrowserWindow.fromWebContents(event.sender);
    menu.popup({ window: win });
});

ipcMain.on('open-archive-folder', () => {
    const archivePath = path.join(app.getPath('documents'), 'Координатор', 'Archive');
    if (!fs.existsSync(archivePath)) {
        fs.mkdirSync(archivePath, { recursive: true });
    }
    shell.openPath(archivePath);
});

ipcMain.on('show-item-in-folder', (event, fullPath) => {
    if (fs.existsSync(fullPath)) {
        shell.showItemInFolder(fullPath);
    }
});

ipcMain.on('set-auto-launch', (event, enable) => {
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe'),
    });
});

// Read file from filesystem (for drag&drop support in renderer)
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        // Security: validate path to prevent path traversal
        if (!isPathSecure(filePath)) {
            return { success: false, error: 'Access denied: invalid file path' };
        }

        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            return { success: false, isDirectory: true, error: 'Path is a directory' };
        }
        const data = fs.readFileSync(filePath);
        return { success: true, data: data.toString('base64'), size: data.length, isDirectory: false };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Read directory recursively (returns file paths with relative structure)
ipcMain.handle('read-dir', async (event, dirPath) => {
    try {
        // Security: validate path to prevent path traversal
        if (!isPathSecure(dirPath)) {
            return { success: false, error: 'Access denied: invalid directory path' };
        }

        const stats = fs.statSync(dirPath);
        if (!stats.isDirectory()) {
            return { success: false, error: 'Path is not a directory' };
        }

        const files = [];
        const dirName = path.basename(dirPath);

        const readDirRecursive = (currentPath, relativePath = '') => {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

                if (entry.isFile()) {
                    files.push({ fullPath, relativePath: relPath, isFile: true });
                } else if (entry.isDirectory()) {
                    readDirRecursive(fullPath, relPath);
                }
            }
        };

        readDirRecursive(dirPath);
        return { success: true, dirName, files };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get file paths from system clipboard (for multi-file paste support)
ipcMain.handle('get-clipboard-files', async () => {
    try {
        // On Linux, file paths are stored as text in x-special/nautilus-clipboard or similar format
        // Try to read as text first (most common format)
        const text = clipboard.readText();
        const filePaths = [];

        // Check for file:// URIs
        if (text.includes('file://')) {
            const lines = text.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('file://')) {
                    const filePath = decodeURIComponent(trimmed.replace('file://', ''));
                    // Security: validate each path from clipboard
                    if (fs.existsSync(filePath) && isPathSecure(filePath)) {
                        filePaths.push(filePath);
                    }
                }
            }
        }

        // Also try reading from native file format
        // Linux: read application/x-nautilus-clipboard or similar
        const formats = clipboard.availableFormats();
        console.log('Clipboard formats:', formats);

        // Try reading raw buffer for URI list (common on Linux)
        for (const format of formats) {
            if (format.includes('uri') || format.includes('file') || format.includes('gnome') || format.includes('nautilus')) {
                try {
                    const buffer = clipboard.readBuffer(format);
                    const text = buffer.toString('utf-8');
                    const lines = text.split('\n').filter(l => l.trim());
                    for (const line of lines) {
                        if (line.startsWith('file://')) {
                            const filePath = decodeURIComponent(line.replace('file://', '').trim());
                            if (fs.existsSync(filePath) && !filePaths.includes(filePath)) {
                                filePaths.push(filePath);
                            }
                        }
                    }
                } catch (e) {
                    // Ignore errors for individual formats
                }
            }
        }

        return { success: true, paths: filePaths };
    } catch (error) {
        return { success: false, error: error.message, paths: [] };
    }
});

// Download handling
app.on('browser-window-created', (event, window) => {
    window.webContents.session.on('will-download', (event, item, webContents) => {
        const coordinatorPath = path.join(app.getPath('documents'), 'Координатор', 'Archive');

        if (!fs.existsSync(coordinatorPath)) {
            fs.mkdirSync(coordinatorPath, { recursive: true });
        }

        const fileName = item.getFilename();
        const filePath = path.join(coordinatorPath, fileName);
        item.setSavePath(filePath);

        item.once('done', (event, state) => {
            if (state === 'completed') {
                const notify = new Notification({
                    title: 'Файл сохранен',
                    body: `${fileName} загружен в Координатор`,
                });
                notify.on('click', () => shell.showItemInFolder(filePath));
                notify.show();
            }
        });
    });
});
