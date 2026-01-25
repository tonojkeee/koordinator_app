const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Koordinator Electron Watcher
 * Restarts Electron on main process changes and waits for Vite.
 */

let electronProcess = null;
const frontendDir = path.join(__dirname, '..');
const electronDir = __dirname;

function startElectron() {
    if (electronProcess) {
        try {
            // On Linux, we might need to be forceful if SIGTERM isn't enough
            electronProcess.kill('SIGTERM');
        } catch (e) {
            console.error('Failed to kill existing process:', e);
        }
    }

    electronProcess = spawn('npx', ['electron', '.'], {
        cwd: frontendDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
    });

    electronProcess.on('exit', (code) => {
        if (code !== null && code !== 0 && code !== 130) { // 130 is SIGINT
            console.error(`\x1b[31mElectron exited with code ${code}. Waiting for code changes...\x1b[0m`);
        }
    });
}

let timeout;
function debounceRestart() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        console.log('\x1b[33m%s\x1b[0m', '🔄 [Electron] Restarting main process...');
        startElectron();
    }, 500);
}

console.log('\x1b[36m%s\x1b[0m', '👀 [Electron] Watcher started. Waiting for Vite (http://localhost:5173)...');

// Use wait-on (available in devDependencies) to wait for Vite
const waitOnArgs = ['wait-on', 'http://localhost:5173', '--timeout', '120000'];
const waitProc = spawn('npx', waitOnArgs, { cwd: frontendDir });

waitProc.on('exit', (code) => {
    if (code === 0) {
        console.log('\x1b[32m%s\x1b[0m', '⚡ [Electron] Vite is ready. Launching app...');
        startElectron();

        // Start watching the electron directory for main process changes
        fs.watch(electronDir, { recursive: true }, (event, filename) => {
            if (filename && (
                filename.endsWith('.js') ||
                filename.endsWith('.cjs') ||
                filename.endsWith('.html') ||
                filename.endsWith('.json')
            )) {
                debounceRestart();
            }
        });
    } else {
        console.error('\x1b[31m❌ [Electron] Vite server not detected after timeout.\x1b[0m');
        process.exit(1);
    }
});

// Handle termination
process.on('SIGINT', () => {
    if (electronProcess) electronProcess.kill('SIGINT');
    process.exit(0);
});
process.on('SIGTERM', () => {
    if (electronProcess) electronProcess.kill('SIGTERM');
    process.exit(0);
});
