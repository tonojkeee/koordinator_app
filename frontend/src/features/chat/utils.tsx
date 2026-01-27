import React from 'react';
import { FileIcon, FileText, FileSpreadsheet, FileQuestion } from 'lucide-react';
import { InvitationActions } from '../../components/chat/InvitationActions';

export const formatDate = (dateString: string, t: (key: string) => string, locale: string = 'ru'): string => {
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (messageDate.getTime() === today.getTime()) {
            return t('chat.today') || 'Сегодня';
        }
        if (messageDate.getTime() === yesterday.getTime()) {
            return t('chat.yesterday') || 'Вчера';
        }

        return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
    } catch {
        return dateString;
    }
};

export const getFileIcon = (filename: string): React.ReactNode => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <FileIcon size={24} strokeWidth={1.5} />;
    }
    if (ext === 'pdf') {
        return <FileText size={24} strokeWidth={1.5} />;
    }
    if (['doc', 'docx'].includes(ext)) {
        return <FileText size={24} strokeWidth={1.5} />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FileSpreadsheet size={24} strokeWidth={1.5} />;
    }
    return <FileQuestion size={24} strokeWidth={1.5} />;
};

export const getFileConfig = (filename: string, t: (key: string) => string): { icon: React.ReactNode; color: string; label: string } => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return { icon: <FileIcon size={24} />, color: 'bg-rose-100 text-rose-600', label: t('chat.fileNotification.image') };
    }
    if (ext === 'pdf') {
        return { icon: <FileText size={24} />, color: 'bg-red-100 text-red-600', label: t('chat.fileNotification.pdf') };
    }
    if (['doc', 'docx'].includes(ext)) {
        return { icon: <FileText size={24} />, color: 'bg-blue-100 text-blue-600', label: t('chat.fileNotification.word') };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return { icon: <FileSpreadsheet size={24} />, color: 'bg-emerald-100 text-emerald-600', label: t('chat.fileNotification.excel') };
    }
    return { icon: <FileQuestion size={24} />, color: 'bg-slate-100 text-slate-600', label: t('chat.fileNotification.file') };
};

export const getFullUrl = (path: string, serverUrl: string | null, apiBaseUrl: string): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (serverUrl || import.meta.env.VITE_API_URL || apiBaseUrl || '').replace(/\/api$/, '');
    const finalPath = path.startsWith('/api') ? path : `/api${path}`;
    return `${baseUrl}${finalPath}`;
};

export const renderMessageContent = (content: string, isSent: boolean, invitationId?: number): (string | React.JSX.Element)[] => {
    if (!content) return [];

    // Check for invitation actions pattern
    const invitationActionsRegex = /\[INVITATION_ACTIONS:(\d+)\]/;
    const invitationMatch = content.match(invitationActionsRegex);

    if (invitationMatch && invitationId) {
        // Remove the action pattern from content and add the component
        const cleanContent = content.replace(invitationActionsRegex, '').trim();
        const contentParts = renderMessageContentInternal(cleanContent, isSent);

        return [
            ...contentParts,
            <InvitationActions key={`invitation-${invitationId}`} invitationId={invitationId} />
        ];
    }

    return renderMessageContentInternal(content, isSent);
};

const renderMessageContentInternal = (content: string, isSent: boolean): (string | React.JSX.Element)[] => {
    if (!content) return [];

    const mentionRegex = /(\B@[a-zA-Z0-9_]+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
        if (part.match(mentionRegex)) {
            return (
                <span
                    key={index}
                    className={`inline-block px-1 py-0.5 rounded font-semibold transition-all ${isSent
                        ? 'bg-white/20 text-white'
                        : 'bg-[#5B5FC7]/10 text-[#5B5FC7]'
                        }`}
                    style={{ margin: '0 1px' }}
                >
                    {part}
                </span>
            );
        }
        return part;
    });
};
