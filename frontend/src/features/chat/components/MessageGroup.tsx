import React from 'react';
import type { Message, User, Reaction } from '../../../types';
import { Avatar, ContextMenu, type ContextMenuOption, cn } from '../../../design-system';
import { MessageSquare, FileText, Pencil, Trash2, Smile, Check, CheckCheck, Crown } from 'lucide-react';
import { formatName } from '../../../utils/formatters';
import { renderMessageContent, getFileConfig } from '../utils';
import { QuickReactionPicker } from './QuickReactionPicker';
import { useTranslation } from 'react-i18next';
import type { MessageGroup } from '../utils/groupMessages';
import { ChatAttachmentItem } from './ChatAttachmentItem';
import { useDocumentViewer } from '../../../features/board/store/useDocumentViewer';
import { useAuthStore } from '../../../store/useAuthStore';

interface MessageGroupCardProps {
    group: MessageGroup;
    isSelf: boolean;
    currentUser: User | null;
    othersReadId?: number;
    highlightDocId: number | null;
    highlightMessageId: number | null;
    onReply: (message: Message) => void;
    onReact: (messageId: number, emoji: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: number) => void;
    quickReactionMessageId: number | null;
    setQuickReactionMessageId: (id: number | null) => void;
    openFullEmojiPicker: (messageId: number) => void;
    addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

export const MessageGroupCard: React.FC<MessageGroupCardProps> = ({
    group,
    isSelf,
    currentUser,
    othersReadId,
    highlightDocId,
    highlightMessageId,
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
    const firstMsg = group.messages[0];

    // Fallback if user info missing from message
    const username = firstMsg.username || '';
    const fullName = firstMsg.full_name || '';
    const avatarUrl = firstMsg.avatar_url;
    const role = firstMsg.role;
    const rank = firstMsg.rank;

    return (
        <div className={cn(
            "flex w-full mb-4 px-2 group/row",
            isSelf ? "flex-row-reverse" : "flex-row",
            "gap-3"
        )}>
            {/* Avatar Column */}
            <div className="shrink-0 w-10 flex flex-col items-center">
                <Avatar
                    src={isSelf ? currentUser?.avatar_url : avatarUrl}
                    name={isSelf
                        ? formatName(currentUser?.full_name || '', currentUser?.username || '')
                        : (username ? formatName(fullName, username) : t('common.system'))
                    }
                    size="md"
                    className="shadow-sm border border-slate-200/50"
                />
            </div>

            {/* Content Column */}
            <div className={cn(
                "flex flex-col min-w-0 max-w-[70%]",
                isSelf ? "items-end" : "items-start"
            )}>
                {/* Header: Name + Time */}
                <div className={cn(
                    "flex items-center gap-2 overflow-hidden mb-1",
                    isSelf ? "flex-row-reverse" : "flex-row"
                )}>
                    <span className={cn(
                        "font-bold text-sm truncate",
                        isSelf ? 'text-blue-600' : 'text-slate-700'
                    )}>
                        {isSelf
                            ? t('chat.you')
                            : (username ? formatName(fullName, username) : t('common.system'))
                        }
                    </span>

                    {!isSelf && rank && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 px-1 rounded bg-slate-50">
                            {rank}
                        </span>
                    )}

                    {((isSelf && currentUser?.role === 'admin') || (!isSelf && role === 'admin')) && (
                        <div className="text-blue-500" title={t('admin.roleAdmin')}>
                            <Crown size={12} fill="currentColor" />
                        </div>
                    )}

                    <span className="text-xs text-slate-400 tabular-nums">
                         {new Date(group.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Body: Messages List */}
                <div className={cn(
                    "flex flex-col gap-1 w-full",
                    isSelf ? "items-end" : "items-start"
                )}>
                    {group.messages.map((msg, index) => (
                        <MessageItem
                            key={msg.id}
                            message={msg}
                            isSelf={isSelf}
                            currentUser={currentUser}
                            othersReadId={othersReadId}
                            isHighlighted={(msg.document_id && highlightDocId === msg.document_id) || highlightMessageId === msg.id}
                            onReply={onReply}
                            onReact={onReact}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            quickReactionMessageId={quickReactionMessageId}
                            setQuickReactionMessageId={setQuickReactionMessageId}
                            openFullEmojiPicker={openFullEmojiPicker}
                            addToast={addToast}
                            isFirst={index === 0}
                            isLast={index === group.messages.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: Individual Message Item ---

interface MessageItemProps {
    message: Message;
    isSelf: boolean;
    currentUser: User | null;
    othersReadId?: number;
    isHighlighted?: boolean;
    onReply: (message: Message) => void;
    onReact: (messageId: number, emoji: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: number) => void;
    quickReactionMessageId: number | null;
    setQuickReactionMessageId: (id: number | null) => void;
    openFullEmojiPicker: (messageId: number) => void;
    addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
    isFirst: boolean;
    isLast: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isSelf,
    currentUser,
    othersReadId,
    isHighlighted,
    onReply,
    onReact,
    onEdit,
    onDelete,
    quickReactionMessageId,
    setQuickReactionMessageId,
    openFullEmojiPicker,
    addToast,
    isFirst,
    isLast,
}) => {
    const { t } = useTranslation();
    const openDocumentViewer = useDocumentViewer((state) => state.open);
    const token = useAuthStore((state) => state.token);

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

    const hasAttachment = !!message.document_id;

    // --- Bubble Styling Logic ---
    const bubbleClass = cn(
        "relative px-4 py-3 shadow-sm transition-all duration-200",
        isSelf
            ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm"
            : "bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm",
        // Stacking radius adjustments
        !isFirst && isSelf && "rounded-tr-2xl", // Restore top-right for non-first self
        !isFirst && !isSelf && "rounded-tl-2xl", // Restore top-left for non-first other
        !isLast && isSelf && "rounded-br-sm", // Sharpen bottom-right for non-last self
        !isLast && !isSelf && "rounded-bl-sm", // Sharpen bottom-left for non-last other
        isHighlighted && "ring-2 ring-yellow-300 shadow-md z-10"
    );

    return (
        <div
            id={`message-${message.id}`}
            className={cn(
                "group/message relative w-fit max-w-full",
                quickReactionMessageId === message.id && "z-50"
            )}
            {...(message.document_id ? { 'data-doc-id': message.document_id } : {})}
        >
             <ContextMenu options={contextOptions} className="w-full">
                <div className={bubbleClass}>

                    {/* Parent Message (Reply Context) */}
                    {message.parent && (
                         <div
                            className={cn(
                                "flex items-center gap-2 mb-2 px-2 py-1 rounded bg-black/5 cursor-pointer transition-opacity opacity-80 hover:opacity-100",
                                isSelf ? "text-blue-50" : "text-slate-600"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                const el = document.getElementById(`message-${message.parent!.id}`);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.classList.add('ring-2', 'ring-blue-400/50');
                                    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400/50'), 1500);
                                }
                            }}
                         >
                            <div className={cn("w-1 h-3 rounded-full", isSelf ? "bg-white/40" : "bg-blue-500/40")} />
                            <span className="text-xs font-bold">{message.parent.username}</span>
                            <span className="text-xs truncate max-w-[150px]">{renderMessageContent(message.parent.content, false)}</span>
                         </div>
                    )}

                    <div className="flex flex-col gap-1">
                        {/* Attachment Display */}
                        {hasAttachment && (
                            <div className="mb-1">
                                <ChatAttachmentItem
                                    msg={message}
                                    isSent={isSelf}
                                    onView={() => {
                                        if (message.file_path) {
                                            openDocumentViewer(
                                                `/board/documents/${message.document_id}/view?token=${token}`,
                                                message.document_title || message.file_path.split('/').pop() || 'Document',
                                                message.file_path.split('/').pop(),
                                                undefined // mimeType is optional
                                            );
                                        }
                                    }}
                                    onDownload={() => {
                                        const link = document.createElement('a');
                                        link.href = `/api/board/documents/${message.document_id}/download?token=${token}`;
                                        link.setAttribute('download', message.document_title || 'download');
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    getFileConfig={(filename) => getFileConfig(filename, t)}
                                    token={token}
                                />
                            </div>
                        )}

                        {/* Message Content */}
                        {message.content && (!hasAttachment || !message.content.startsWith('📎')) && (
                            <div
                                className="text-[15px] leading-relaxed break-words"
                                style={{
                                    fontSize: typeof currentUser?.preferences?.font_size === 'number'
                                        ? `${currentUser.preferences.font_size}px`
                                        : currentUser?.preferences?.font_size === 'small' ? '13px'
                                        : currentUser?.preferences?.font_size === 'large' ? '17px'
                                        : '15px'
                                }}
                            >
                                {renderMessageContent(message.content, isSelf, message.invitation_id)}
                                {message.updated_at && (
                                    <span className="text-[10px] ml-1.5 opacity-60 italic select-none">
                                        ({t('chat.edited')})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hover Actions (Absolute outside bubble) */}
                    <div className={cn(
                        "opacity-0 group-hover/message:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center p-0.5 gap-0.5 z-20",
                        isSelf ? "right-full mr-2" : "left-full ml-2"
                    )}>
                            <button
                            onClick={(e) => { e.stopPropagation(); onReply(message); }}
                            className="p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title={t('chat.reply')}
                        >
                            <MessageSquare size={14} />
                        </button>
                        {!isSelf && (
                        <button
                            data-reaction-trigger={message.id}
                            onMouseDown={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                setQuickReactionMessageId(quickReactionMessageId === message.id ? null : message.id);
                            }}
                            className={cn(
                                "p-1.5 hover:bg-slate-50 rounded transition-colors",
                                quickReactionMessageId === message.id ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-600"
                            )}
                            title={t('chat.reactions.add')}
                        >
                            <Smile size={14} />
                        </button>
                    )}
                            {(message.user_id === currentUser?.id || currentUser?.role === 'admin') && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(message); }}
                                    className="p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                    title={t('common.edit')}
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(message.id); }}
                                    className="p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                                    title={t('common.delete')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Read Receipt (Inside or outside? Reference puts it inside or just below) */}
                    {isSelf && (
                        <div className="absolute bottom-1 right-2 text-white/70">
                                {message.id <= (othersReadId || 0) ? (
                                <CheckCheck size={12} className="text-white" />
                            ) : (
                                <Check size={12} />
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Reaction Picker Popover */}
                {quickReactionMessageId === message.id && (
                    <QuickReactionPicker
                        messageId={message.id}
                        triggerRef={
                            { current: document.querySelector(`[data-reaction-trigger="${message.id}"]`) } as React.RefObject<HTMLElement>
                        }
                        onReaction={onReact}
                        onOpenFullPicker={() => {
                            setQuickReactionMessageId(null);
                            openFullEmojiPicker(message.id);
                        }}
                        onClose={() => setQuickReactionMessageId(null)}
                    />
                )}

                {/* Reactions Display (Hanging below bubble) */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className={cn(
                        "flex flex-wrap gap-1 mt-1 px-1",
                        isSelf ? "justify-end" : "justify-start"
                    )}>
                        {groupReactions(message.reactions).map(group => (
                            <button
                                key={group.emoji}
                                onClick={() => onReact(message.id, group.emoji)}
                                className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-all border shadow-sm",
                                    group.hasMine
                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                )}
                                title={group.users.join(', ')}
                            >
                                <span>{group.emoji}</span>
                                <span className="tabular-nums opacity-70">{group.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </ContextMenu>
        </div>
    );
}
