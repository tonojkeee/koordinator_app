import asyncio
import sys
import os
import logging

# Add the backend directory to sys.path
sys.path.append(os.getcwd())

from app.core.config import get_settings
from app.modules.email.smtp_server import SMTPServerManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smtp_runner")

async def main():
    settings = get_settings()
    
    # In a real production environment, you might want to use port 25
    # but that requires root privileges. 2525 is used for development/non-root.
    smtp_port = int(os.getenv("SMTP_SERVER_PORT", 2525))
    smtp_host = os.getenv("SMTP_SERVER_HOST", "0.0.0.0")
    
    smtp_server = SMTPServerManager(hostname=smtp_host, port=smtp_port)
    
    logger.info(f"Starting standalone SMTP server on {smtp_host}:{smtp_port}...")
    smtp_server.start()
    
    try:
        # Keep the script running
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Stopping SMTP server...")
        smtp_server.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
