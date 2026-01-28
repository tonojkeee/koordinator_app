import React from 'react';
import type { Message, User } from '../../../types';
import { MessageBubble } from './MessageBubble';
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

    return (
        <div className="flex flex-col space-y-1 mt-auto">
            {messages.map((msg, index) => {
                const isSent = msg.user_id === currentUser?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                const msgDate = new Date(msg.created_at).toDateString();
                const prevMsgDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
                const showDateSeparator = msgDate !== prevMsgDate;

                const lastReadId = initialLastReadId || 0;
                const showUnreadSeparator = lastReadId > 0 &&
                    msg.id > lastReadId &&
                    (prevMsg ? prevMsg.id <= lastReadId : true) &&
                    !isSent;

                const isFirstInGroup = !prevMsg || prevMsg.user_id !== msg.user_id || showDateSeparator || showUnreadSeparator;
                const isLastInGroup = !nextMsg || nextMsg.user_id !== msg.user_id || (nextMsg && new Date(nextMsg.created_at).toDateString() !== msgDate);

                const isHighlighted = (msg.document_id && highlightDocId === msg.document_id) || highlightMessageId === msg.id;

                return (
                    <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                            <div className={`date-separator ${animations.fadeIn}`}>
                                <span className="date-label">{formatDate(msg.created_at, t, i18n.language)}</span>
                            </div>
                        )}

                        {showUnreadSeparator && (
                            <div className={`flex items-center my-8 ${isUnreadBannerVisible ? animations.slideIn : animations.outCollapse}`}>
                                <div className="flex-1 border-t border-rose-200/60" />
                                <div className="mx-4 flex items-center space-x-2 px-3 py-1 bg-rose-50/50 rounded-full border border-rose-100">
                                    <Bell size={12} className="text-rose-500" />
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{t('chat.newMessages')}</span>
                                </div>
                                <div className="flex-1 border-t border-rose-200/60" />
                            </div>
                        )}

                        <MessageBubble
                            message={msg}
                            isSelf={isSent}
                            isFirstInGroup={isFirstInGroup}
                            isLastInGroup={isLastInGroup}
                            showAvatar={isLastInGroup}
                            othersReadId={othersReadId}
                            currentUser={currentUser}
                            isHighlighted={isHighlighted}
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
