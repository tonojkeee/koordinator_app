import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const distElectronDir = path.join(rootDir, 'dist-electron');

function log(message) {
    console.log(`${colors.bright}${colors.cyan}[BUILD] ${message}${colors.reset}`);
}

function error(message) {
    console.error(`${colors.bright}${colors.red}[ERROR] ${message}${colors.reset}`);
    process.exit(1);
}

function runCommand(command) {
    try {
        log(`Running: ${command}`);
        execSync(command, { stdio: 'inherit', cwd: rootDir });
    } catch (e) {
        error(`Command failed: ${command}`);
    }
}

// 1. Clean previous builds
log(`Cleaning previous builds...`);
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    log(`Removed ${distDir}`);
}
if (fs.existsSync(distElectronDir)) {
    fs.rmSync(distElectronDir, { recursive: true, force: true });
    log(`Removed ${distElectronDir}`);
}

// 2. Build Frontend
log(`Building Frontend (Vite)...`);
runCommand('npm run build');

// 3. Build Electron (Linux & Windows)
log(`Building Electron (Linux & Windows)...`);
// We can run electron-builder for multiple targets if the OS supports it.
// On Linux, we can build for Linux easily. For Windows (nsis), we might need wine if strictly on Linux, 
// but electron-builder often handles this if wine is installed, or simpler nsis builds.
// Let's assume the environment is capable or will warn.
// Passing --linux and --win to electron-builder
runCommand('npx electron-builder --linux --win');

log(`${colors.green}Build completed successfully! Check dist-electron/ for artifacts.${colors.reset}`);
