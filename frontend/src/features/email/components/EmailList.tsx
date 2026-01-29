import React, { useMemo } from 'react';
import {
    Paperclip, Star, Trash2, Mail, ArrowDownLeft, ArrowUpRight,
    FolderInput, Archive, MailOpen, AlertCircle, ShieldAlert,
    Reply, Forward, Printer, Users, Inbox
} from 'lucide-react';
import {
    isToday,
    isYesterday,
    isThisWeek,
    isThisMonth,
    parseISO
} from 'date-fns';
import type { EmailMessageList, EmailFolder } from '../emailService';
import { useTranslation } from 'react-i18next';
import { Avatar, ContextMenu, cn } from '../../../design-system';

interface EmailListProps {
    emails: EmailMessageList[];
    customFolders: EmailFolder[];
    onSelectEmail: (id: number) => void;
    selectedEmailId: number | null;
    selectedIds: Set<number>;
    onToggleSelect: (id: number, shiftKey?: boolean) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onToggleStar: (id: number, current: boolean) => void;
    onToggleRead: (id: number, current: boolean) => void;
    onToggleImportant: (id: number, current: boolean) => void;
    onMoveToFolder: (id: number, folderId: number | null) => void;
    onArchive: (id: number) => void;
    onSpam: (id: number) => void;
    onDelete: (id: number) => void;
    onReply: (id: number) => void;
    onReplyAll: (id: number) => void;
    onForward: (id: number) => void;
    onPrint: (id: number) => void;
}

type DateGroup = 'today' | 'yesterday' | 'last_7_days' | 'last_month' | 'older';

const EmailList: React.FC<EmailListProps> = ({
    emails,
    customFolders,
    onSelectEmail,
    selectedEmailId,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
    onToggleStar,
    onToggleRead,
    onToggleImportant,
    onMoveToFolder,
    onArchive,
    onSpam,
    onDelete,
    onReply,
    onReplyAll,
    onForward,
    onPrint
}) => {
    const { t } = useTranslation();

    const allSelected = emails.length > 0 && emails.every(e => selectedIds.has(e.id));
    const someSelected = emails.some(e => selectedIds.has(e.id)) && !allSelected;

    const groupedEmails = useMemo(() => {
        const sorted = [...emails].sort((a, b) => {
            const dateA = new Date(a.received_at.includes('Z') ? a.received_at : `${a.received_at}Z`);
            const dateB = new Date(b.received_at.includes('Z') ? b.received_at : `${b.received_at}Z`);
            return dateB.getTime() - dateA.getTime();
        });

        const groups: Record<DateGroup, EmailMessageList[]> = {
            today: [],
            yesterday: [],
            last_7_days: [],
            last_month: [],
            older: []
        };

        sorted.forEach(email => {
            const isoStr = email.received_at.includes('Z') ? email.received_at : `${email.received_at}Z`;
            const date = parseISO(isoStr);

            if (isToday(date)) {
                groups.today.push(email);
            } else if (isYesterday(date)) {
                groups.yesterday.push(email);
            } else if (isThisWeek(date)) {
                groups.last_7_days.push(email);
            } else if (isThisMonth(date)) {
                groups.last_month.push(email);
            } else {
                groups.older.push(email);
            }
        });

        return groups;
    }, [emails]);

    if (emails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full bg-slate-50/20">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-cyan-600/30">
                    <Inbox size={32} strokeWidth={1.5} />
                </div>
                <div className="text-sm font-bold text-slate-900">{t('email.list_no_emails')}</div>
                <div className="text-xs text-slate-500 mt-1">{t('email.list_empty_folder_desc') || "This folder is currently empty"}</div>
            </div>
        );
    }

    const renderEmailItem = (email: EmailMessageList) => {
        const isSelected = selectedEmailId === email.id;
        const isChecked = selectedIds.has(email.id);
        const isUnread = !email.is_read;
        const isSent = email.is_sent;
        const isoStr = email.received_at.includes('Z') ? email.received_at : `${email.received_at}Z`;
        const dateObj = new Date(isoStr);

        const dateStr = dateObj.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
        });

        const contextOptions = [
            {
                label: isUnread ? t('email.list_tooltip_mark_read') : t('email.list_tooltip_mark_unread'),
                icon: isUnread ? MailOpen : Mail,
                onClick: () => onToggleRead(email.id, email.is_read)
            },
            {
                label: email.is_starred ? t('email.remove_from_favorites') : t('email.add_to_favorites'),
                icon: Star,
                onClick: () => onToggleStar(email.id, email.is_starred)
            },
            {
                label: email.is_important ? t('email.remove_importance') : t('email.details_tooltip_important'),
                icon: AlertCircle,
                onClick: () => onToggleImportant(email.id, email.is_important)
            },
            {
                label: t('email.archived'),
                icon: Archive,
                onClick: () => onArchive(email.id),
                disabled: email.is_archived
            },
            {
                label: email.is_spam ? t('email.not_spam') : t('email.spam'),
                icon: ShieldAlert,
                onClick: () => onSpam(email.id),
                divider: true
            },
            {
                label: t('email.details_tooltip_reply'),
                icon: Reply,
                onClick: () => onReply(email.id)
            },
            {
                label: t('email.reply_all'),
                icon: Users,
                onClick: () => onReplyAll(email.id)
            },
            {
                label: t('email.details_tooltip_forward'),
                icon: Forward,
                onClick: () => onForward(email.id)
            },
            {
                label: t('email.details_tooltip_print'),
                icon: Printer,
                onClick: () => onPrint(email.id),
                divider: true
            },
            {
                label: `${t('email.details_tooltip_move_to')} ${t('email.inbox')}`,
                icon: FolderInput,
                onClick: () => onMoveToFolder(email.id, null),
                disabled: email.folder_id === null && !isSent
            },
            ...customFolders.map(f => ({
                label: `${t('email.details_tooltip_move_to')} ${f.name}`,
                icon: FolderInput,
                onClick: () => onMoveToFolder(email.id, f.id),
                disabled: email.folder_id === f.id
            })),
            {
                label: t('common.delete'),
                icon: Trash2,
                onClick: () => onDelete(email.id),
                variant: 'danger' as const,
                divider: true
            }
        ];

        return (
            <ContextMenu key={email.id} options={contextOptions}>
                <div
                    onClick={() => onSelectEmail(email.id)}
                    className={cn(
                        "group relative flex items-start gap-3 px-4 py-2 cursor-pointer transition-all duration-200 border-l-[3px]",
                        isSelected
                            ? "bg-cyan-50 border-cyan-600 shadow-sm z-10"
                            : isChecked
                                ? "bg-cyan-50/50 border-transparent"
                                : "bg-white border-transparent hover:bg-slate-50"
                    )}
                >
                    <div className={cn(
                        "flex items-center self-stretch mr-1 transition-opacity duration-200",
                        isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                                e.stopPropagation();
                                onToggleSelect(email.id, (e.nativeEvent as MouseEvent).shiftKey);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer transition-colors"
                        />
                    </div>

                    <div className="relative shrink-0 mt-0.5">
                        <Avatar
                            name={isSent ? email.to_address : email.from_address}
                            size="sm"
                            className={cn(
                                "transition-transform duration-200",
                                isSelected ? "ring-2 ring-cyan-100" : "ring-1 ring-slate-100"
                            )}
                        />
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white text-[10px]",
                            isSent ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                            {isSent ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownLeft size={10} strokeWidth={3} />}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-0">
                        <div className="flex justify-between items-baseline">
                            <span className={cn(
                                "text-[12px] truncate",
                                isUnread ? "font-bold text-slate-900" : "font-medium text-slate-600"
                            )}>
                                {isSent ? `${t('email.list_to')}: ${email.to_address.split('@')[0]}` : email.from_address.split('@')[0]}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {email.has_attachments && <Paperclip size={11} className="text-slate-400" />}
                                <span className={cn(
                                    "text-[10px] tabular-nums",
                                    isUnread ? "text-cyan-600 font-bold" : "text-slate-400 font-medium"
                                )}>
                                    {dateStr}
                                </span>
                            </div>
                        </div>

                        <div className={cn(
                            "text-[12px] truncate",
                            isUnread ? "font-semibold text-slate-900" : "text-slate-600"
                        )}>
                            {email.subject || t('email.list_no_subject')}
                        </div>

                        <div className="text-[11px] text-slate-500 line-clamp-1 leading-normal">
                            {email.snippet || t('email.details_no_preview')}
                        </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm p-0.5 rounded-lg shadow-md border border-slate-200">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleStar(email.id, email.is_starred); }}
                            className={cn(
                                "p-1 rounded-md hover:bg-slate-100 transition-colors",
                                email.is_starred ? "text-amber-400" : "text-slate-400"
                            )}
                            title={email.is_starred ? t('email.remove_from_favorites') : t('email.add_to_favorites')}
                        >
                            <Star size={13} fill={email.is_starred ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleRead(email.id, email.is_read); }}
                            className={cn(
                                "p-1 rounded-md hover:bg-slate-100 transition-colors",
                                !email.is_read ? "text-cyan-600" : "text-slate-400"
                            )}
                            title={isUnread ? t('email.list_tooltip_mark_read') : t('email.list_tooltip_mark_unread')}
                        >
                            <MailOpen size={13} className={isUnread ? "hidden" : "block"} />
                            <Mail size={13} className={isUnread ? "block" : "hidden"} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(email.id); }}
                            className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title={t('common.delete')}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>

                    {/* Unread dot */}
                    {isUnread && !isSelected && !isChecked && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                    )}
                </div>
            </ContextMenu>
        );
    };

    return (
        <div className="w-full flex flex-col">
            <div className="flex items-center px-4 py-2 bg-slate-50/50 border-b border-slate-100 sticky top-0 z-30 backdrop-blur-sm">
                <div className="flex items-center mr-3">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => {
                            if (el) el.indeterminate = someSelected;
                        }}
                        onChange={() => {
                            if (allSelected) onDeselectAll();
                            else onSelectAll();
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {selectedIds.size > 0
                        ? t('email.selected_count', { count: selectedIds.size })
                        : t('email.list_selection_help')}
                </div>
            </div>

            {(Object.keys(groupedEmails) as DateGroup[]).map(groupKey => {
                const groupEmails = groupedEmails[groupKey];
                if (groupEmails.length === 0) return null;

                return (
                    <React.Fragment key={groupKey}>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-2 bg-slate-50/80 backdrop-blur-sm sticky top-[37px] z-20 border-y border-slate-100/50">
                            {t(`email.groups.${groupKey}`)}
                        </div>
                        {groupEmails.map(renderEmailItem)}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default EmailList;

