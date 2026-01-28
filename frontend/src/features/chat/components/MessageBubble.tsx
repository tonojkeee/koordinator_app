import React from 'react';
import { Message, User, Reaction } from '../../../types';
import { Avatar, ContextMenu, type ContextMenuOption, cn } from '../../../design-system';
import { MessageSquare, FileText, Pencil, Trash2, Smile, Check, CheckCheck, Crown } from 'lucide-react';
import { formatName } from '../../../utils/formatters';
import { renderMessageContent } from '../utils';
import { QuickReactionPicker } from './QuickReactionPicker';
import { animations } from '../../../design-system/tokens/animations';
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
    message: Message;
    isSelf: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    showAvatar: boolean;
    othersReadId?: number;
    currentUser?: User | null;
    isHighlighted?: boolean;
    onReply: (message: Message) => void;
    onReact: (messageId: number, emoji: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: number) => void;
    quickReactionMessageId: number | null;
    setQuickReactionMessageId: (id: number | null) => void;
    openFullEmojiPicker: (messageId: number) => void;
    addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isSelf,
    isFirstInGroup,
    isLastInGroup,
    showAvatar,
    othersReadId,
    currentUser,
    isHighlighted,
    onReply,
    onReact,
    onEdit,
    onDelete,
    quickReactionMessageId,
    setQuickReactionMessageId,
    openFullEmojiPicker,
    addToast,
}) => {
    const { t } = useTranslation();

    const groupReactions = (reactions: Reaction[]) => {
        if (!reactions) return [];
        const groups: { [emoji: string]: { emoji: string; count: number; users: string[]; avatars: (string | null)[]; hasMine: boolean } } = {};

        reactions.forEach(r => {
            if (!groups[r.emoji]) {
                groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], avatars: [], hasMine: false };
            }
            groups[r.emoji].count++;
            groups[r.emoji].users.push(r.username);
            groups[r.emoji].avatars.push(r.avatar_url || null);
            if (r.user_id === currentUser?.id) {
                groups[r.emoji].hasMine = true;
            }
        });

        return Object.values(groups);
    };

    const msgGroupClass = isFirstInGroup && isLastInGroup
        ? 'rounded-lg'
        : isFirstInGroup
            ? 'rounded-t-lg rounded-b-sm'
            : isLastInGroup
                ? 'rounded-b-lg rounded-t-sm'
                : 'rounded-sm';

    const contextOptions: ContextMenuOption[] = [
        {
            label: t('chat.reply'),
            icon: MessageSquare,
            onClick: () => onReply(message)
        },
        {
            label: t('chat.copy_text'),
            icon: FileText,
            onClick: () => {
                navigator.clipboard.writeText(message.content);
                addToast({ type: 'success', title: t('common.success'), message: t('chat.text_copied') });
            }
        }
    ];

    if (message.user_id === currentUser?.id || currentUser?.role === 'admin') {
        contextOptions.push({
            label: t('common.edit'),
            icon: Pencil,
            onClick: () => onEdit(message),
            divider: true
        });
        contextOptions.push({
            label: t('common.delete'),
            icon: Trash2,
            variant: 'danger',
            onClick: () => onDelete(message.id)
        });
    }

    return (
        <div className={`${isFirstInGroup ? 'mt-7' : 'mt-[2px]'} ${animations.slideIn}`}>
            <ContextMenu options={contextOptions}>
                <div className="flex items-end group flex-row gap-2 w-full">
                    <div className="flex flex-col items-center shrink-0 w-10">
                        {showAvatar ? (
                            <Avatar
                                src={isSelf ? currentUser?.avatar_url : message.avatar_url}
                                name={isSelf ? formatName(currentUser?.full_name || '', currentUser?.username || '') : (message.username ? formatName(message.full_name, message.username || '') : t('common.system'))}
                                size="md"
                                className="shadow-sm border border-slate-200/50 relative z-10"
                            />
                        ) : (
                            <div className="w-10" />
                        )}
                    </div>

                    <div className="flex flex-col items-start min-w-0 flex-1 relative">
                        {isFirstInGroup && (
                            <div className="message-metadata flex-row px-1 mb-1.5">
                                {!isSelf && message.rank && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mr-0.5">
                                        {message.rank}
                                    </span>
                                )}
                                <span className={`font-bold text-[13px] tracking-tight ${isSelf ? 'text-blue-500' : 'text-slate-700'}`}>
                                    {isSelf ? t('chat.you') : (message.username ? formatName(message.full_name, message.username) : t('common.system'))}
                                </span>
                                {((isSelf && currentUser?.role === 'admin') || (!isSelf && message.role === 'admin')) && (
                                    <div className="text-blue-500" title={t('admin.roleAdmin')}>
                                        <Crown size={10} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div
                            id={`message-${message.id}`}
                            className={cn(
                                "relative group/message max-w-[85%] px-4 py-2 flex flex-col transition-all duration-200",
                                isSelf ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-900 border border-slate-200",
                                msgGroupClass,
                                isHighlighted && "ring-2 ring-blue-400 shadow-lg z-10"
                            )}
                            {...(message.document_id ? { 'data-doc-id': message.document_id } : {})}
                            style={{
                                fontSize: typeof currentUser?.preferences?.font_size === 'number'
                                    ? `${currentUser.preferences.font_size}px`
                                    : currentUser?.preferences?.font_size === 'small' ? '12px'
                                        : currentUser?.preferences?.font_size === 'large' ? '18px'
                                            : '14px'
                            }}
                        >
                            {message.parent && (
                                <div
                                    className={cn(
                                        "mb-2 p-2 rounded border-l-4 text-xs cursor-pointer transition-colors",
                                        isSelf
                                            ? "bg-white/10 border-white/40 text-white/90"
                                            : "bg-slate-200/50 border-blue-500 text-slate-600"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const el = document.getElementById(`message-${message.parent!.id}`);
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            el.classList.add('ring-2', 'ring-blue-400/50');
                                            setTimeout(() => {
                                                el.classList.remove('ring-2', 'ring-blue-400/50');
                                            }, 1500);
                                        }
                                    }}
                                >
                                    <span className="block font-black uppercase tracking-widest text-[10px] mb-0.5">{message.parent.username}</span>
                                    <span className="line-clamp-1 opacity-80">{renderMessageContent(message.parent.content, message.parent.username === currentUser?.username)}</span>
                                </div>
                            )}

                            <div className="flex flex-col relative">
                                {message.content && (!message.document_id || !message.content.startsWith('📎')) && (
                                    <div className={`leading-relaxed whitespace-pre-wrap break-words pr-12 ${isSelf ? 'text-white' : 'text-slate-900'} ${message.document_id ? 'mt-2 opacity-90' : ''}`}>
                                        {renderMessageContent(message.content, isSelf, message.invitation_id)}
                                        {message.updated_at && (
                                            <span className={`text-[10px] ml-1 opacity-60 italic select-none ${isSelf ? 'text-white' : 'text-slate-500'}`}>
                                                ({t('chat.edited')})
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className={cn(
                                    "flex items-center justify-end space-x-1 self-end mt-1 -mr-1",
                                    isSelf ? "text-white/70" : "text-slate-400"
                                )}>
                                    <span className="text-[10px] tabular-nums font-medium">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isSelf && (
                                        message.id <= (othersReadId || 0) ? (
                                            <CheckCheck size={12} className="ml-0.5 text-blue-200" />
                                        ) : (
                                            <Check size={12} className="ml-0.5" />
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="absolute top-0 left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReply(message);
                                    }}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-90"
                                    title={t('chat.reply')}
                                >
                                    <MessageSquare size={14} />
                                </button>
                                <div className="relative">
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setQuickReactionMessageId(quickReactionMessageId === message.id ? null : message.id);
                                        }}
                                        className={`p-1.5 bg-white border rounded-lg shadow-sm transition-all active:scale-90 ${quickReactionMessageId === message.id
                                            ? 'text-blue-600 border-blue-300 bg-blue-50'
                                            : 'border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'
                                            }`}
                                        title={t('chat.reactions.add')}
                                    >
                                        <Smile size={14} />
                                    </button>

                                    {quickReactionMessageId === message.id && (
                                        <QuickReactionPicker
                                            messageId={message.id}
                                            onReaction={onReact}
                                            onOpenFullPicker={() => {
                                                setQuickReactionMessageId(null);
                                                openFullEmojiPicker(message.id);
                                            }}
                                            onClose={() => setQuickReactionMessageId(null)}
                                            position="top"
                                        />
                                    )}
                                </div>
                                {(message.user_id === currentUser?.id || currentUser?.role === 'admin') && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(message);
                                            }}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-90"
                                            title={t('common.edit')}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(message.id);
                                            }}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-red-600 hover:border-red-200 transition-all active:scale-90"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ContextMenu>

            {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 ml-12">
                    {groupReactions(message.reactions).map(group => (
                        <button
                            key={group.emoji}
                            onClick={() => onReact(message.id, group.emoji)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold transition-all backdrop-blur-sm ${group.hasMine
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 hover:bg-blue-600'
                                : 'bg-white/80 text-slate-700 border border-slate-200/50 hover:bg-white hover:border-blue-200 shadow-sm'
                                }`}
                            title={group.users.join(', ')}
                        >
                            <span className="text-base leading-none">{group.emoji}</span>
                            <span className={`tabular-nums ${group.hasMine ? 'text-white' : 'text-slate-600'}`}>
                                {group.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
