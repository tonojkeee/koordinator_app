"""
Shared file upload utilities to eliminate code duplication.
Used by auth, board, archive, zsspd modules for consistent file handling.

This module consolidates functionality from:
- file_helpers.py (merged)
- file_utils.py (this file)
"""

import os
import re
import hashlib
import unicodedata
import logging
from typing import BinaryIO, Tuple, Optional
from fastapi import UploadFile
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Reserved filenames on Windows
RESERVED_NAMES = {
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
}


# =============================================================================
# FILENAME SANITIZATION
# =============================================================================


def sanitize_filename(filename: str) -> str:
    """
    Comprehensive filename sanitization to prevent path traversal and filesystem issues.

    Args:
        filename: The filename to sanitize

    Returns:
        Sanitized filename safe for filesystem operations
    """
    if not filename:
        return "unnamed"

    # 1. Unicode normalization (prevent homograph attacks)
    filename = unicodedata.normalize("NFKD", filename)

    # 2. Remove path separators and dangerous characters
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", filename)

    # 3. Remove ALL occurrences of .. (not just replace once)
    while ".." in sanitized:
        sanitized = sanitized.replace("..", "")

    # 4. Remove leading/trailing dots, spaces, and underscores
    sanitized = sanitized.strip(". _")

    # 5. Check for reserved names (Windows)
    name_without_ext = os.path.splitext(sanitized)[0].upper()
    if name_without_ext in RESERVED_NAMES:
        sanitized = f"file_{sanitized}"

    # 6. Limit length to prevent filesystem issues
    if len(sanitized) > 200:
        name, ext = os.path.splitext(sanitized)
        sanitized = name[: 200 - len(ext)] + ext

    # 7. Ensure we have a valid filename
    if not sanitized or sanitized == ".":
        return "unnamed"

    return sanitized


# Alias for backward compatibility
get_safe_filename = sanitize_filename


# =============================================================================
# FILE PATH OPERATIONS
# =============================================================================


def sanitize_file_path(
    base_dir: str, user_id: int, file_path: str
) -> Tuple[bool, str, str]:
    """
    Sanitize and validate file path to prevent path traversal attacks.

    Args:
        base_dir: Base directory for file storage
        user_id: User ID for user-specific directory
        file_path: Relative file path to validate

    Returns:
        Tuple of (is_valid, full_path, error_message)
    """
    # Check for empty or suspicious path
    if not file_path or ".." in file_path:
        return False, "", "Invalid file path"

    # Build full path
    user_dir = os.path.join(base_dir, str(user_id))
    full_path = os.path.join(user_dir, file_path)

    # Normalize path to resolve any . or .. components
    full_path = os.path.normpath(full_path)
    user_dir = os.path.normpath(user_dir)

    # Check if file exists
    if not os.path.exists(full_path):
        return False, "", "File not found"

    # Verify path is within user directory (prevent path traversal)
    if not full_path.startswith(user_dir + os.sep):
        return False, "", "Path traversal detected"

    return True, full_path, ""


def validate_file_path_exists(
    base_dir: str, user_id: int, file_path: str
) -> Tuple[bool, str]:
    """
    Validate that a file path exists and is safe.

    Returns:
        Tuple of (is_valid, error_message)
    """
    is_valid, _, error = sanitize_file_path(base_dir, user_id, file_path)
    return is_valid, error


def ensure_user_directory(base_dir: str, user_id: int) -> str:
    """
    Ensure user-specific directory exists and return its path.

    Args:
        base_dir: Base directory for file storage
        user_id: User ID for user-specific directory

    Returns:
        Path to user directory
    """
    user_dir = os.path.join(base_dir, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    return user_dir


# =============================================================================
# FILE VALIDATION
# =============================================================================


def validate_file_size(file: UploadFile, max_size_mb: int) -> None:
    """Validate file size against maximum allowed size in MB."""
    if file.size and file.size > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size of {max_size_mb}MB",
        )


def validate_file_type(file: UploadFile, allowed_types: str = None) -> None:
    """Validate file type against allowed types (comma-separated extensions)."""
    if not allowed_types:
        return  # Allow all types if none specified

    allowed_set = {t.strip().lower() for t in allowed_types.split(",")}
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in allowed_set:
        raise HTTPException(
            status_code=415,
            detail=f"File type {ext} not allowed. Allowed types: {allowed_types}",
        )


def parse_allowed_types(allowed_types_str: str) -> Optional[set]:
    """Parse comma-separated allowed types string into set."""
    if not allowed_types_str:
        return None
    return {t.strip().lower() for t in allowed_types_str.split(",")}


# =============================================================================
# FILE OPERATIONS
# =============================================================================


async def save_uploaded_file(
    file: UploadFile,
    upload_dir: str,
    max_size_mb: int = 50,
    allowed_types: str = None,
    custom_filename: str = None,
) -> Tuple[str, int]:
    """
    Save uploaded file to disk with validation.

    Args:
        file: UploadFile from FastAPI
        upload_dir: Directory to save file to
        max_size_mb: Maximum file size in MB (default: 50)
        allowed_types: Comma-separated allowed file types (default: all types)
        custom_filename: Custom filename to use (default: generate from original)

    Returns:
        Tuple of (file_path, file_size)

    Raises:
        HTTPException: If validation fails
    """
    validate_file_size(file, max_size_mb)
    validate_file_type(file, allowed_types)

    file_size = 0
    content = file.file

    os.makedirs(upload_dir, exist_ok=True)

    if custom_filename:
        filename = custom_filename
    else:
        filename = file.filename

    unique_filename = _generate_unique_filename(upload_dir, filename)
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as f:
        while chunk := content.read(8192):
            f.write(chunk)
            file_size += len(chunk)

    return file_path, file_size


def _generate_unique_filename(directory: str, filename: str) -> str:
    """Generate unique filename to prevent overwrites."""
    name, ext = os.path.splitext(filename)
    counter = 1
    unique_name = filename

    while os.path.exists(os.path.join(directory, unique_name)):
        unique_name = f"{name}_{counter}{ext}"
        counter += 1

    return unique_name


def get_file_size(file_path: str) -> int:
    """
    Get file size in bytes.

    Returns:
        File size in bytes, or 0 if file doesn't exist
    """
    try:
        return os.path.getsize(file_path)
    except (OSError, FileNotFoundError):
        return 0


def delete_file_safe(file_path: str) -> bool:
    """
    Safely delete file if it exists.

    Returns:
        True if file was deleted, False otherwise
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except OSError as e:
        logger.error(f"Error deleting file {file_path}: {e}")
    return False


async def calculate_file_size_bytes(max_mb_str: str) -> int:
    """Convert MB string to bytes."""
    try:
        max_mb = int(max_mb_str)
        return max_mb * 1024 * 1024
    except (ValueError, TypeError):
        return 50 * 1024 * 1024  # Default 50MB
