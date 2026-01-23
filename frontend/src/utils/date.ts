import i18n from '../i18n';

/**
 * Date and time formatting utilities.
 * 
 * Provides consistent date/time formatting across the application
 * with support for relative time, UTC handling, and localization.
 */

/**
 * Parse a date string, handling UTC timestamps correctly.
 * 
 * @param dateStr - Date string to parse
 * @returns Date object
 * 
 * @example
 * const date = parseUTCDate('2024-01-15T10:30:00');
 * // Treats as UTC by appending Z if missing
 */
export const parseUTCDate = (dateStr: string): Date => {
  try {
    // Treat naive strings from backend as UTC by appending Z if missing
    const isoStr = dateStr.includes('Z') ? dateStr : `${dateStr}Z`;
    return new Date(isoStr);
  } catch {
    return new Date(dateStr);
  }
};

/**
 * Format date in short format (DD.MM.YYYY).
 * 
 * @param date - Date string or Date object
 * @param fallback - Fallback string if parsing fails
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-01-15T10:30:00Z') // "15.01.2024"
 */
export const formatDate = (
  date: string | Date,
  fallback: string = 'Invalid date'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    console.warn('Date formatting error:', date);
    return fallback;
  }
};

/**
 * Format time in short format (HH:MM).
 * 
 * @param date - Date string or Date object
 * @param fallback - Fallback string if parsing fails
 * @returns Formatted time string
 * 
 * @example
 * formatTime('2024-01-15T10:30:00Z') // "10:30"
 */
export const formatTime = (
  date: string | Date,
  fallback: string = 'Invalid time'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    console.warn('Time formatting error:', date);
    return fallback;
  }
};

/**
 * Format date and time (DD.MM.YYYY HH:MM).
 * 
 * @param date - Date string or Date object
 * @param fallback - Fallback string if parsing fails
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // "15.01.2024 10:30"
 */
export const formatDateTime = (
  date: string | Date,
  fallback: string = 'Invalid date'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    console.warn('DateTime formatting error:', date);
    return fallback;
  }
};

/**
 * Format date with short month name (DD MMM HH:MM).
 * 
 * @param date - Date string or Date object
 * @param fallback - Fallback string if parsing fails
 * @returns Formatted date string
 * 
 * @example
 * formatDateShortMonth('2024-01-15T10:30:00Z') // "15 янв 10:30"
 */
export const formatDateShortMonth = (
  date: string | Date,
  fallback: string = 'Invalid date'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    console.warn('Date formatting error:', date);
    return fallback;
  }
};

/**
 * Format date for charts (DD MMM).
 * 
 * @param date - Date string or Date object
 * @param fallback - Fallback string if parsing fails
 * @returns Formatted date string
 * 
 * @example
 * formatChartDate('2024-01-15T10:30:00Z') // "15 янв"
 */
export const formatChartDate = (
  date: string | Date,
  fallback: string = 'Invalid date'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
    }).format(dateObj);
  } catch {
    console.warn('Date formatting error:', date);
    return fallback;
  }
};

/**
 * Format relative time (e.g., "5 мин назад", "2 ч назад").
 * 
 * @param date - Date string or Date object
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime('2024-01-15T10:25:00Z') // "5 мин назад"
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return i18n.t('date.just_now');
    if (diffMins < 60) return i18n.t('date.minutes_ago', { count: diffMins });
    if (diffMins < 1440) return i18n.t('date.hours_ago', { count: Math.floor(diffMins / 60) });

    return formatDate(dateObj);
  } catch {
    return formatDate(date);
  }
};

/**
 * Format duration from milliseconds to human-readable string.
 * 
 * @param ms - Duration in milliseconds
 * @param options - Formatting options
 * @returns Formatted duration string
 * 
 * @example
 * formatDuration(3665000) // "1ч 1м"
 * formatDuration(3665000, { showSeconds: true }) // "1ч 1м 5с"
 */
export const formatDuration = (
  ms: number,
  options: { showSeconds?: boolean } = {}
): string => {
  const { showSeconds = false } = options;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) parts.push(i18n.t('date.days', { count: days }));
  if (hours % 24 > 0) parts.push(i18n.t('date.hours', { count: hours % 24 }));
  if (minutes % 60 > 0) parts.push(i18n.t('date.minutes', { count: minutes % 60 }));
  if (showSeconds && seconds % 60 > 0) parts.push(i18n.t('date.seconds', { count: seconds % 60 }));

  return parts.length > 0 ? parts.join(' ') : i18n.t('date.minutes_short', { count: 0 });
};
