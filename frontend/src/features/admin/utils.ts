export const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatActivityDate = (dateStr: string, t: (key: string, params?: Record<string, string | number>) => string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return t('admin.time_just_now');
    if (diffInHours < 24) return t('admin.time_hours_ago', { count: diffInHours });
    return t('admin.time_yesterday');
};

export const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export const formatDuration = (start: Date, t: (key: string, params?: Record<string, string | number>) => string) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('admin.duration_less_than_min');
    if (diffInMinutes < 60) return t('admin.duration_minutes', { count: diffInMinutes });
    if (diffInMinutes < 1440) return t('admin.duration_hours', { count: Math.floor(diffInMinutes / 60) });
    return t('admin.duration_days', { count: Math.floor(diffInMinutes / 1440) });
};
