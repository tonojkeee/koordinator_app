/**
 * Timezone utilities for frontend.
 * 
 * Handles user timezone detection, storage, and datetime conversion
 * from UTC strings to user's local timezone.
 */

import i18n from '../i18n';

/**
 * Get user's browser timezone.
 * 
 * @returns Timezone string (e.g., "Europe/Moscow", "Asia/Krasnoyarsk")
 */
export const getUserTimezone = (): string => {
  const stored = localStorage.getItem('user_timezone');
  if (stored) return stored;
  
  // Detect from browser
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localStorage.setItem('user_timezone', browserTz);
  return browserTz;
};

/**
 * Set user's timezone in localStorage.
 * 
 * @param timezone - Timezone string to store
 */
export const setUserTimezone = (timezone: string): void => {
  localStorage.setItem('user_timezone', timezone);
};

/**
 * Parse UTC date string to Date object.
 * Handles both timezone-aware and naive strings from backend.
 * 
 * @param dateStr - ISO date string from backend
 * @returns Date object
 */
export const parseUTCDate = (dateStr: string): Date => {
  try {
    // Backend sends UTC dates; treat naive strings as UTC
    const isoStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
    return new Date(isoStr);
  } catch {
    return new Date(dateStr);
  }
};

/**
 * Format date in user's timezone.
 * 
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDateInTimezone = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      timeZone: getUserTimezone(),
      ...options,
    }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', date, error);
    return 'Invalid date';
  }
};

/**
 * Format date in short format (DD.MM.YYYY).
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-01-15T10:30:00Z') // "15.01.2024"
 */
export const formatDate = (date: string | Date): string => {
  return formatDateInTimezone(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format time in short format (HH:MM).
 * 
 * @param date - Date string or Date object
 * @returns Formatted time string
 * 
 * @example
 * formatTime('2024-01-15T10:30:00Z') // "10:30"
 */
export const formatTime = (date: string | Date): string => {
  return formatDateInTimezone(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date and time (DD.MM.YYYY HH:MM).
 * 
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // "15.01.2024 10:30"
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDateInTimezone(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date with short month name (DD MMM HH:MM).
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string
 * 
 * @example
 * formatDateShortMonth('2024-01-15T10:30:00Z') // "15 янв 10:30"
 */
export const formatDateShortMonth = (date: string | Date): string => {
  return formatDateInTimezone(date, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date for charts (DD MMM).
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string
 * 
 * @example
 * formatChartDate('2024-01-15T10:30:00Z') // "15 янв"
 */
export const formatChartDate = (date: string | Date): string => {
  return formatDateInTimezone(date, {
    day: '2-digit',
    month: 'short',
  });
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
 * Format activity date for user status (e.g., "Был(а) сегодня в 14:30").
 * 
 * @param date - Date string or Date object
 * @param t - Translation function
 * @returns Formatted activity date string
 */
export const formatActivityDate = (date: string | Date, t: (key: string, params?: Record<string, string | number>) => string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseUTCDate(date) : date;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return `${t('date.today')} ${formatTime(dateObj)}`;
    }
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return `${t('date.yesterday')} ${formatTime(dateObj)}`;
    }

    return formatDate(dateObj);
  } catch {
    return formatDate(date);
  }
};

/**
 * List of common Russian timezones.
 */
export const COMMON_TIMEZONES = [
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)' },
  { value: 'UTC', label: 'UTC (UTC+0)' },
];

/**
 * Get current time in user's timezone as ISO string.
 * 
 * @returns Current time as ISO string in user's timezone
 */
export const getCurrentTimeInTimezone = (): string => {
  const now = new Date();
  return now.toISOString();
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