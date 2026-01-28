import React, { useMemo } from 'react';
import type { Message, User } from '../../../types';
import { MessageGroupCard } from './MessageGroup';
import { groupMessages } from '../utils/groupMessages';
import { formatDate } from '../utils';
import { animations } from '../../../design-system/tokens/animations';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MessageListProps {
    messages: Message[];
    currentUser: User | null;
    initialLastReadId: number | null;
    isUnreadBannerVisible: boolean;
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

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUser,
    initialLastReadId,
    isUnreadBannerVisible,
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
    const { t, i18n } = useTranslation();

    // Group messages efficiently
    const groups = useMemo(() => groupMessages(messages), [messages]);

    return (
        <div className="flex flex-col space-y-2 mt-auto px-2 pb-4">
            {groups.map((group, index) => {
                const isSent = group.user_id === currentUser?.id;
                const prevGroup = index > 0 ? groups[index - 1] : null;

                // Date Separators (check if group date is different from previous)
                const groupDate = new Date(group.date).toDateString();
                const prevGroupDate = prevGroup ? new Date(prevGroup.date).toDateString() : null;
                const showDateSeparator = groupDate !== prevGroupDate;

                // Unread Banner Logic
                // We need to check if *any* message in this group crosses the unread line
                // But typically, the unread line appears *before* the first unread message.
                // So check if the FIRST message in this group is the first unread one relative to previous group.

                const lastReadId = initialLastReadId || 0;
                const firstMsg = group.messages[0];
                const prevGroupLastMsg = prevGroup ? prevGroup.messages[prevGroup.messages.length - 1] : null;

                const showUnreadSeparator = lastReadId > 0 &&
                    firstMsg.id > lastReadId &&
                    (prevGroupLastMsg ? prevGroupLastMsg.id <= lastReadId : true) &&
                    !isSent;

                return (
                    <React.Fragment key={group.id}>
                        {showDateSeparator && (
                            <div className={`date-separator ${animations.fadeIn} my-4`}>
                                <span className="date-label bg-slate-100 text-slate-500 border border-slate-200">
                                    {formatDate(group.date.toISOString(), t, i18n.language)}
                                </span>
                            </div>
                        )}

                        {showUnreadSeparator && (
                            <div className={`flex items-center my-6 ${isUnreadBannerVisible ? animations.slideIn : animations.outCollapse}`}>
                                <div className="flex-1 border-t border-rose-200/60" />
                                <div className="mx-4 flex items-center space-x-2 px-3 py-1 bg-rose-50/50 rounded-full border border-rose-100 shadow-sm">
                                    <Bell size={12} className="text-rose-500" />
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{t('chat.newMessages')}</span>
                                </div>
                                <div className="flex-1 border-t border-rose-200/60" />
                            </div>
                        )}

                        <MessageGroupCard
                            group={group}
                            isSelf={isSent}
                            currentUser={currentUser}
                            othersReadId={othersReadId}
                            highlightDocId={highlightDocId}
                            highlightMessageId={highlightMessageId}
                            onReply={onReply}
                            onReact={onReact}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            quickReactionMessageId={quickReactionMessageId}
                            setQuickReactionMessageId={setQuickReactionMessageId}
                            openFullEmojiPicker={openFullEmojiPicker}
                            addToast={addToast}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};
