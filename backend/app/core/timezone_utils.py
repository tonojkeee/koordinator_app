"""Timezone utilities for datetime conversion.

Provides functions to convert UTC datetimes to user's local timezone
and format them appropriately for API responses.
"""

from datetime import datetime, timezone
from typing import Optional
import pytz


def convert_to_user_timezone(utc_datetime: datetime, user_timezone: str = "UTC") -> datetime:
    """
    Convert UTC datetime to user's local timezone.
    
    Args:
        utc_datetime: UTC datetime object
        user_timezone: User's timezone string (e.g., "Europe/Moscow", "Asia/Krasnoyarsk")
    
    Returns:
        Datetime object in user's timezone
    
    Raises:
        pytz.exceptions.UnknownTimeZoneError: If timezone is invalid
    """
    if utc_datetime.tzinfo is None:
        # Assume UTC if no timezone info
        utc_datetime = utc_datetime.replace(tzinfo=timezone.utc)
    
    # Get user timezone
    tz = pytz.timezone(user_timezone)
    
    # Convert to user timezone
    return utc_datetime.astimezone(tz)


def format_datetime_for_user(
    utc_datetime: Optional[datetime], 
    user_timezone: str = "UTC",
    iso_format: bool = True
) -> Optional[str]:
    """
    Format datetime in user's timezone for API response.
    
    Args:
        utc_datetime: UTC datetime object (or None)
        user_timezone: User's timezone string
        iso_format: If True, return ISO format string; otherwise return datetime object
    
    Returns:
        Formatted datetime string or None if input is None
    """
    if utc_datetime is None:
        return None
    
    try:
        localized = convert_to_user_timezone(utc_datetime, user_timezone)
        if iso_format:
            return localized.isoformat()
        return localized
    except Exception:
        # Fallback to original if conversion fails
        return utc_datetime.isoformat() if iso_format else utc_datetime


def validate_timezone(tz_string: str) -> bool:
    """
    Validate timezone string.
    
    Args:
        tz_string: Timezone string to validate
    
    Returns:
        True if valid, False otherwise
    """
    try:
        pytz.timezone(tz_string)
        return True
    except pytz.exceptions.UnknownTimeZoneError:
        return False


def get_common_timezones() -> list[str]:
    """
    Get list of common Russian timezones.
    
    Returns:
        List of timezone strings
    """
    return [
        "Europe/Kaliningrad",
        "Europe/Moscow",
        "Europe/Samara",
        "Asia/Yekaterinburg",
        "Asia/Omsk",
        "Asia/Krasnoyarsk",
        "Asia/Irkutsk",
        "Asia/Yakutsk",
        "Asia/Vladivostok",
        "Asia/Magadan",
        "Asia/Kamchatka",
        "UTC",
    ]


def get_current_time_in_timezone(tz_string: str = "UTC") -> str:
    """
    Get current time in specified timezone as ISO string.
    
    Args:
        tz_string: Timezone string
    
    Returns:
        Current datetime in specified timezone as ISO string
    """
    try:
        tz = pytz.timezone(tz_string)
        return datetime.now(tz).isoformat()
    except pytz.exceptions.UnknownTimeZoneError:
        # Fallback to UTC
        return datetime.now(timezone.utc).isoformat()
