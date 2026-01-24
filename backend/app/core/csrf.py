"""
CSRF Protection Module

Provides CSRF token generation and validation for state-changing operations.
Uses double-submit cookie pattern as defense-in-depth even with JWT authentication.
"""

import secrets
import hmac
import hashlib
import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CSRFProtection:
    """CSRF token generation and validation"""
    
    @staticmethod
    def generate_token() -> str:
        """Generate a cryptographically secure CSRF token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_token_hash(token: str, secret: str) -> str:
        """Create HMAC hash of CSRF token"""
        return hmac.new(
            secret.encode(),
            token.encode(),
            hashlib.sha256
        ).hexdigest()
    
    @staticmethod
    def validate_token(request: Request, token_from_header: Optional[str]) -> bool:
        """
        Validate CSRF token from request header against cookie value.
        
        Args:
            request: FastAPI request object
            token_from_header: CSRF token from X-CSRF-Token header
            
        Returns:
            True if token is valid, False otherwise
        """
        if not token_from_header:
            logger.warning("CSRF validation failed: no token in header")
            return False
        
        # Get token from cookie
        token_from_cookie = request.cookies.get("csrf_token")
        if not token_from_cookie:
            logger.warning("CSRF validation failed: no token in cookie")
            logger.warning(f"Available cookies: {list(request.cookies.keys())}")
            return False
        
        logger.info(f"CSRF validation: header='{token_from_header[:10]}...', cookie='{token_from_cookie[:10]}...'")
        
        # Constant-time comparison to prevent timing attacks
        is_valid = hmac.compare_digest(token_from_header, token_from_cookie)
        logger.info(f"CSRF validation result: {is_valid}")
        
        if not is_valid:
            logger.warning(f"CSRF token mismatch - header: {token_from_header}, cookie: {token_from_cookie}")
        
        return is_valid


async def require_csrf_token(request: Request) -> None:
    """
    Dependency to require and validate CSRF token for state-changing operations.
    
    Raises:
        HTTPException: If CSRF token is missing or invalid
    """
    # Skip CSRF check for safe methods
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return
    
    logger.info(f"CSRF check for {request.method} {request.url.path}")
    
    # Get CSRF token from header
    csrf_token = request.headers.get("X-CSRF-Token")
    
    if not csrf_token:
        logger.warning(f"CSRF token missing for {request.method} {request.url.path}")
        logger.warning(f"Available headers: {dict(request.headers)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing"
        )
    
    # Validate token
    if not CSRFProtection.validate_token(request, csrf_token):
        logger.warning(f"CSRF token invalid for {request.method} {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token invalid"
        )
