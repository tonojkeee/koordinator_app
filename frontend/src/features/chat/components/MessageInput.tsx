import React from 'react';
import { useTranslation } from 'react-i18next';
import { Smile, Send } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react';
import type { Message } from '../../../types';

export interface MessageInputHandle {
    handleMention: (username: string) => void;
    openForReaction: (msgId: number) => void;
}

interface MessageInputProps {
    isConnected: boolean;
    sendMessage: (content: string | { content: string; parent_id?: number }) => void;
    sendTyping: (is_typing: boolean) => void;
    activeThread: Message | null;
    setActiveThread: (msg: Message | null) => void;
    handleReactionClick: (messageId: number, emoji: string) => void;
    channelId?: string;
    typingUsers?: Record<number, { name: string, timestamp: number }>;
}

export const MessageInput = React.forwardRef<MessageInputHandle, MessageInputProps>(({
    isConnected,
    sendMessage,
    sendTyping,
    activeThread,
    setActiveThread,
    handleReactionClick,
    typingUsers = {}
}, ref) => {
    const { t } = useTranslation();
    const [inputMessage, setInputMessage] = React.useState('');
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [reactionTargetId, setReactionTargetId] = React.useState<number | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const emojiPickerRef = React.useRef<HTMLDivElement>(null);

    const typingDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingSentRef = React.useRef<boolean>(false);
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());

    React.useImperativeHandle(ref, () => ({
        handleMention: (username: string) => {
            setInputMessage(prev => {
                const prefix = prev.endsWith(' ') ? '' : (prev.length > 0 ? ' ' : '');
                return prev + prefix + '@' + username + ' ';
            });
            inputRef.current?.focus();
        },
        openForReaction: (msgId: number) => {
            setReactionTargetId(msgId);
            setShowEmojiPicker(true);
        }
    }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);

        if (!lastTypingSentRef.current) {
            sendTyping(true);
            lastTypingSentRef.current = true;
        }

        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);

        typingDebounceRef.current = setTimeout(() => {
            sendTyping(false);
            lastTypingSentRef.current = false;
        }, 3000);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputMessage.trim() && isConnected) {
            if (activeThread) {
                sendMessage({ content: inputMessage.trim(), parent_id: activeThread.id });
            } else {
                sendMessage(inputMessage.trim());
            }
            setInputMessage('');
            setActiveThread(null);
            sendTyping(false);
            lastTypingSentRef.current = false;
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (reactionTargetId) {
            handleReactionClick(reactionTargetId, emojiData.emoji);
            setShowEmojiPicker(false);
            setReactionTargetId(null);
        } else {
            setInputMessage(prev => prev + emojiData.emoji);
            setShowEmojiPicker(false);
            inputRef.current?.focus();
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const typingUsersList = React.useMemo(() => {
        return Object.values(typingUsers)
            .filter(u => currentTime - u.timestamp < 3000)
            .slice(0, 3);
    }, [typingUsers, currentTime]);

    return (
        <div className="relative px-4 pb-4">
            {typingUsersList.length > 0 && (
                <div className="absolute -top-6 left-6 flex items-center space-x-2 text-[11px] text-[#616161]">
                    <span className="animate-pulse">●</span>
                    {typingUsersList.map((u, i) => (
                        <span key={i} className="font-semibold">
                            {u.name}
                            {i < typingUsersList.length - 1 && ', '}
                        </span>
                    ))}
                    <span>{t('chat.typing')}...</span>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex flex-col bg-white border border-[#E0E0E0] rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-[#5B5FC7] focus-within:border-[#5B5FC7] transition-all">
                {/* Toolbar */}
                <div className="flex items-center px-2 py-1 border-b border-[#F0F0F0] gap-1">
                    <button
                        type="button"
                        className="p-1.5 text-[#616161] hover:bg-[#F5F5F5] rounded-md transition-colors"
                        title="Format"
                    >
                        <span className="font-bold text-xs">B</span>
                    </button>
                    <button
                        type="button"
                        className="p-1.5 text-[#616161] hover:bg-[#F5F5F5] rounded-md transition-colors"
                        title="Italic"
                    >
                        <span className="italic text-xs font-serif">I</span>
                    </button>
                    <button
                        type="button"
                        className="p-1.5 text-[#616161] hover:bg-[#F5F5F5] rounded-md transition-colors"
                        title="Underline"
                    >
                        <span className="underline text-xs">U</span>
                    </button>
                    <div className="w-px h-4 bg-[#E0E0E0] mx-1" />
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-1.5 text-[#616161] hover:bg-[#F5F5F5] rounded-md transition-colors ${showEmojiPicker ? 'bg-[#F0F0F0] text-[#5B5FC7]' : ''}`}
                        title="Emoji"
                        disabled={!isConnected}
                    >
                        <Smile size={16} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder={t('chat.placeholder')}
                        disabled={!isConnected}
                        className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm text-[#242424] placeholder:text-[#888888] disabled:opacity-50"
                        autoComplete="off"
                    />

                    {showEmojiPicker && (
                        <div
                            ref={emojiPickerRef}
                            className="absolute bottom-full left-0 mb-2 z-50 shadow-xl rounded-lg border border-[#E0E0E0]"
                        >
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.LIGHT}
                                emojiStyle={EmojiStyle.NATIVE}
                                searchPlaceholder={t('chat.searchEmoji')}
                                width={300}
                                height={350}
                                previewConfig={{ showPreview: false }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center px-2 py-1.5">
                    <div className="text-[10px] text-[#888888] px-2">
                        {/* Hint or status could go here */}
                    </div>
                    <button
                        type="submit"
                        disabled={!isConnected || !inputMessage.trim()}
                        className="p-1.5 text-[#5B5FC7] hover:bg-[#EEF2FF] rounded-md transition-all disabled:text-[#BDBDBD] disabled:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                        title={t('chat.send')}
                    >
                        <Send size={18} strokeWidth={1.5} className="ml-0.5" />
                    </button>
                </div>
            </form>
        </div>
    );
});
