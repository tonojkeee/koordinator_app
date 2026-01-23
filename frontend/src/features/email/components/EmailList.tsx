import { 
    Paperclip, Star, Trash2, Mail, ArrowDownLeft, ArrowUpRight, 
    FolderInput, Archive, MailOpen, AlertCircle, ShieldAlert,
    Reply, Forward, Printer, Users
} from 'lucide-react';
import type { EmailMessageList, EmailFolder } from '../emailService';
import { useTranslation } from 'react-i18next';
import { Avatar, ContextMenu } from '../../../design-system';
import { parseUTCDate } from '../../../utils/date';

interface EmailListProps {
    emails: EmailMessageList[];
    customFolders: EmailFolder[];
    onSelectEmail: (id: number) => void;
    selectedEmailId: number | null;
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

const EmailList: React.FC<EmailListProps> = ({ 
    emails, 
    customFolders,
    onSelectEmail, 
    selectedEmailId, 
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

    const sortedEmails = [...emails].sort((a, b) => {
        const dateA = new Date(a.received_at.includes('Z') ? a.received_at : `${a.received_at}Z`);
        const dateB = new Date(b.received_at.includes('Z') ? b.received_at : `${b.received_at}Z`);
        return dateB.getTime() - dateA.getTime();
    });

    if (emails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full">
                <div className="text-xs font-black uppercase tracking-widest opacity-60">{t('email.list_no_emails')}</div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col divide-y divide-slate-100">
            {sortedEmails.map(email => {
                const isSelected = selectedEmailId === email.id;
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
                            className={`
                                group relative flex flex-col p-4 cursor-pointer transition-all duration-200 border-l-4
                                ${isSelected 
                                    ? 'bg-indigo-50/50 border-indigo-600 shadow-sm z-10' 
                                    : isUnread 
                                        ? 'bg-white border-transparent hover:bg-slate-50' 
                                        : 'bg-white border-transparent hover:bg-slate-50 opacity-80'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative">
                                        <Avatar name={isSent ? email.to_address : email.from_address} size="xs" className="shrink-0" />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${isSent ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                            {isSent ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownLeft size={10} strokeWidth={3} />}
                                        </div>
                                    </div>
                                    <span className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                        {isSent ? `${t('email.list_to')}: ${email.to_address.split('@')[0]}` : email.from_address.split('@')[0]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {email.has_attachments && <Paperclip size={12} className="text-slate-400" />}
                                    <span className={`text-[10px] tabular-nums ${isUnread ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                                        {dateStr}
                                    </span>
                                </div>
                            </div>

                            <div className={`text-[13px] truncate mb-1 ${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>
                                {email.subject || t('email.list_no_subject')}
                            </div>

                            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {email.subject} - {t('email.details_no_preview')}
                            </div>

                            <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm border border-slate-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleStar(email.id, email.is_starred); }}
                                    className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${email.is_starred ? 'text-amber-400' : 'text-slate-400'}`}
                                >
                                    <Star size={14} fill={email.is_starred ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleRead(email.id, email.is_read); }}
                                    className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${!email.is_read ? 'text-indigo-600' : 'text-slate-400'}`}
                                >
                                    <Mail size={14} fill={!email.is_read ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(email.id); }}
                                    className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </ContextMenu>
                );
            })}
        </div>
    );
};

export default EmailList;
