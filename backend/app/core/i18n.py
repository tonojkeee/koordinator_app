import json
import os
from pathlib import Path
from typing import Dict, Any


class I18N:
    def __init__(self, locales_dir: str, default_locale: str = "ru"):
        self.locales_dir = Path(locales_dir)
        self.default_locale = default_locale
        self.translations: Dict[str, Dict[str, Any]] = {}
        self._load_translations()

    def _load_translations(self):
        """Load translation files from the locales directory."""
        if not self.locales_dir.exists():
            print(f"Warning: Locales directory {self.locales_dir} does not exist.")
            return

        for locale_dir in self.locales_dir.iterdir():
            if locale_dir.is_dir():
                locale = locale_dir.name
                messages_file = locale_dir / "messages.json"
                if messages_file.exists():
                    try:
                        with open(messages_file, "r", encoding="utf-8") as f:
                            self.translations[locale] = json.load(f)
                    except Exception as e:
                        print(f"Error loading translations for {locale}: {e}")

    def t(self, key: str, locale: str = None, **kwargs) -> str:
        """
        Get translated text by key.
        Supports dot notation for nested keys (e.g. "auth.invalid_credentials").
        Falls back to default locale if translation is missing.
        """
        target_locale = locale or self.default_locale

        # Try to find translation in target locale
        translation = self._get_translation(key, target_locale)

        # If not found and target is not default, try default locale
        if translation is None and target_locale != self.default_locale:
            translation = self._get_translation(key, self.default_locale)

        # If still not found, return the key itself
        if translation is None:
            return key

        # Perform interpolation if kwargs provided
        if kwargs:
            try:
                return translation.format(**kwargs)
            except Exception:
                return translation

        return translation

    def _get_translation(self, key: str, locale: str) -> str | None:
        if locale not in self.translations:
            return None

        parts = key.split(".")
        current = self.translations[locale]

        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None

        return str(current) if isinstance(current, (str, int, float)) else None


# Initialize global instance
# Assuming this file is in app/core/i18n.py
current_dir = Path(__file__).parent.parent
locales_dir = current_dir / "locales"

i18n = I18N(locales_dir=str(locales_dir), default_locale="ru")


def get_text(key: str, **kwargs) -> str:
    """Helper function to get translation"""
    # In a real app, we might want to get locale from context/request
    # For now, we default to 'ru' but support passing locale in kwargs if needed
    locale = kwargs.pop("locale", None)
    return i18n.t(key, locale=locale, **kwargs)


def get_locale(request) -> str:
    """Get user's preferred locale from request headers"""
    accept_language = request.headers.get("accept-language", "ru")
    return "en" if "en" in accept_language.lower() else "ru"
