import uvicorn
import os
import sys
import subprocess
import signal
import time
import argparse
from app.core.config import get_settings

def run_command(command, cwd=None, shell=True):
    """Run a shell command and return the process"""
    return subprocess.Popen(command, cwd=cwd, shell=shell)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Koordinator Runner")
    parser.add_argument("mode", choices=["prod", "dev", "build"], default="prod", nargs="?", 
                        help="Mode to run: 'prod' (backend only, default), 'dev' (backend + frontend dev), 'build' (build frontend + serve)")
    args = parser.parse_args()

    settings = get_settings()
    
    # Resolve absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__)) # /backend
    root_dir = os.path.dirname(base_dir)
    frontend_dir = os.path.join(root_dir, "frontend")
    cert_dir = os.path.join(base_dir, "certs")
    
    processes = []

    try:
        if args.mode == "dev":
            print("🚀 Starting Koordinator in DEVELOPMENT mode...")
            
            # Start Frontend (Vite)
            print("🎨 Starting Frontend (Vite)...")
            frontend_proc = run_command("npm run dev", cwd=frontend_dir)
            processes.append(frontend_proc)
            
            # Start Backend (Uvicorn)
            print("📦 Starting Backend (FastAPI) with reload...")
            # We'll run the uvicorn.run below instead of separate process to keep reload working well
            # But since we want parallel frontend, we run uvicorn in the main thread

        elif args.mode == "build":
            print("🏗️  Building Koordinator for PRODUCTION...")
            print("🔨 Building Frontend...")
            build_status = subprocess.run("npm run build", cwd=frontend_dir, shell=True)
            if build_status.returncode != 0:
                print("❌ Frontend build failed.")
                sys.exit(1)
            print("✅ Build complete. Starting server...")

        # Configure SSL only if HTTPS is enabled
        ssl_config = {}
        if settings.use_https:
            if os.path.exists(os.path.join(cert_dir, "key.pem")) and os.path.exists(os.path.join(cert_dir, "cert.pem")):
                ssl_config = {
                    "ssl_keyfile": os.path.join(cert_dir, "key.pem"),
                    "ssl_certfile": os.path.join(cert_dir, "cert.pem")
                }
            else:
                print("⚠️ WARNING: HTTPS enabled but certificates not found! Falling back to HTTP.")

        # Run Backend
        print(f"📡 Backend starting on port 5100 (Mode: {args.mode})...")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=5100,
            reload=settings.debug or (args.mode == "dev"),
            log_level="info",
            **ssl_config
        )

    except KeyboardInterrupt:
        print("\n🛑 Stopping services...")
        for p in processes:
            if sys.platform == "win32":
                p.terminate()
            else:
                os.kill(p.pid, signal.SIGTERM)
        print("👋 Goodbye!")

