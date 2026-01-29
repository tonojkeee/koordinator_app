import React, { useEffect, useState, useRef } from 'react';
import { emailService, type EmailMessage, type EmailFolder, type EmailMessageUpdate } from '../emailService';
import { Paperclip, Download, Star, Trash2, Reply, Forward, Printer, FileText, MoreHorizontal, AlertCircle, FolderInput, Check, Loader2, Send, Maximize2 } from 'lucide-react';
import { Avatar, cn, TextArea, Button, useToast } from '../../../design-system';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

interface EmailDetailsProps {
    emailId: number;
    customFolders: EmailFolder[];
    onEmailUpdate: () => void;
    onStatsUpdate: () => void;
    onReply: (email: EmailMessage) => void;
    onForward: (email: EmailMessage) => void;
    onDelete: (id: number) => void;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({ emailId, customFolders, onEmailUpdate, onStatsUpdate, onReply, onForward, onDelete }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [email, setEmail] = useState<EmailMessage | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMoveDropdownOpen, setIsMoveDropdownOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleQuickReply = async () => {
        if (!email || !replyText.trim() || isSending) return;

        setIsSending(true);
        try {
            await emailService.sendEmail({
                to_address: email.from_address,
                subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                body_text: replyText
            });

            setReplyText('');
            addToast({
                title: t('email.sent_success'),
                message: t('email.sent_success_desc'),
                type: 'success'
            });
            onEmailUpdate();
        } catch (error) {
            console.error("Failed to send quick reply", error);
            addToast({
                title: t('email.send_error'),
                message: t('email.send_error_desc'),
                type: 'error'
            });
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        const fetchEmail = async () => {
            setLoading(true);
            try {
                const data = await emailService.getMessage(emailId);
                setEmail(data);

                if (!data.is_read) {
                    await emailService.updateMessage(emailId, { is_read: true });
                    setEmail(prev => prev ? { ...prev, is_read: true } : null);
                    onEmailUpdate();
                    onStatsUpdate();
                }
            } catch (error) {
                console.error("Failed to load email", error);
            } finally {
                setLoading(false);
            }
        };

        if (emailId) {
            fetchEmail();
        }
    }, [emailId, onEmailUpdate, onStatsUpdate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMoveDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const updateEmail = async (updates: EmailMessageUpdate) => {
        if (!email) return;
        try {
            const updated = await emailService.updateMessage(email.id, updates);
            setEmail(updated);
            onEmailUpdate();
            onStatsUpdate();
        } catch (error) {
            console.error("Failed to update email", error);
        }
    };

    const handleMoveToFolder = async (folderId: number | null) => {
        await updateEmail({ folder_id: folderId });
        setIsMoveDropdownOpen(false);
    };

    if (loading) return (
        <div className="flex flex-col h-full items-center justify-center bg-white space-y-3">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.loading')}</span>
        </div>
    );

    if (!email) return null;

    const isoStr = email.received_at.includes('Z') ? email.received_at : `${email.received_at}Z`;
    const dateObj = new Date(isoStr);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Action Bar */}
            <div className="h-14 px-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => email && onReply(email)}
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-50 hover:text-cyan-700 rounded-lg transition-all text-sm font-semibold active:scale-95"
                    >
                        <Reply size={18} strokeWidth={2} />
                        <span>{t('email.details_tooltip_reply')}</span>
                    </button>
                    <button
                        onClick={() => email && onForward(email)}
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-50 hover:text-cyan-700 rounded-lg transition-all text-sm font-semibold active:scale-95"
                    >
                        <Forward size={18} strokeWidth={2} />
                        <span>{t('email.details_tooltip_forward')}</span>
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => updateEmail({ is_starred: !email.is_starred })}
                        className={cn(
                            "p-2 rounded-lg transition-all active:scale-90",
                            email.is_starred ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-50 hover:text-amber-500"
                        )}
                        title={email.is_starred ? t('email.remove_from_favorites') : t('email.add_to_favorites')}
                    >
                        <Star size={18} fill={email.is_starred ? "currentColor" : "none"} strokeWidth={2} />
                    </button>
                    <button
                        onClick={() => updateEmail({ is_important: !email.is_important })}
                        className={cn(
                            "p-2 rounded-lg transition-all active:scale-90",
                            email.is_important ? "text-rose-600 bg-rose-50" : "text-slate-400 hover:bg-slate-50 hover:text-rose-600"
                        )}
                        title={t('email.details_tooltip_important')}
                    >
                        <AlertCircle size={18} fill={email.is_important ? "currentColor" : "none"} strokeWidth={2} />
                    </button>
                    <button
                        onClick={() => onDelete(email.id)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                        title={t('common.delete')}
                    >
                        <Trash2 size={18} strokeWidth={2} />
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsMoveDropdownOpen(!isMoveDropdownOpen)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-semibold active:scale-95",
                                isMoveDropdownOpen ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50"
                            )}
                            title={t('email.details_tooltip_move')}
                        >
                            <FolderInput size={18} strokeWidth={2} />
                            <span>{t('email.details_tooltip_move')}</span>
                        </button>

                        {isMoveDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                    {t('email.folders')}
                                </div>
                                <button
                                    onClick={() => handleMoveToFolder(null)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors font-medium"
                                >
                                    <span>{t('email.inbox')}</span>
                                    {email.folder_id === null && <Check size={14} strokeWidth={3} className="text-cyan-700" />}
                                </button>
                                {customFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleMoveToFolder(folder.id)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors font-medium"
                                    >
                                        <span className="truncate">{folder.name}</span>
                                        {email.folder_id === folder.id && <Check size={14} strokeWidth={3} className="text-cyan-700" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all active:scale-95">
                        <Printer size={18} strokeWidth={2} />
                    </button>
                    <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all active:scale-95">
                        <MoreHorizontal size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
                        {email.subject || t('email.details_no_subject')}
                    </h1>

                    <div className="flex items-start justify-between mb-10 pb-8 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <Avatar name={email.from_address} size="md" className="ring-4 ring-slate-50" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-slate-900">{email.from_address}</span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        &lt;{email.from_address}&gt;
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5 font-medium">
                                    {t('email.details_header_to')} <span className="text-slate-700">{email.to_address}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-sm text-slate-500 font-semibold tabular-nums">
                            <div className="text-slate-900">{dateStr}</div>
                            <div className="opacity-60">{timeStr}</div>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed mb-16 font-normal">
                        {email.body_html ? (
                            <div dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(email.body_html, {
                                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'div', 'span', 'img', 'hr'],
                                    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height', 'align'],
                                    ALLOW_DATA_ATTR: false
                                })
                            }} />
                        ) : (
                            <div className="whitespace-pre-wrap">{email.body_text || t('email.details_no_content')}</div>
                        )}
                    </div>

                    {email.attachments && email.attachments.length > 0 && (
                        <div className="border-t border-slate-200 pt-8 mt-12">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <Paperclip size={14} strokeWidth={2.5} />
                                {email.attachments.length} {t('email.details_attachment_plural')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {email.attachments.map(att => (
                                    <div key={att.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-cyan-500/30 hover:bg-cyan-50/30 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 text-slate-400 group-hover:text-cyan-700 group-hover:bg-white transition-all">
                                            <FileText size={24} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-900 truncate group-hover:text-cyan-900 transition-colors">{att.filename}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{Math.round(att.file_size / 1024)} {t('common.kb')}</div>
                                        </div>
                                        <a
                                            href={`/api/email/attachments/${att.id}/download`}
                                            className="p-2.5 text-slate-400 hover:text-cyan-700 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-cyan-100 shadow-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download size={20} strokeWidth={2} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Reply Box */}
            <div className="border-t border-slate-200 p-4 bg-slate-50/50">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
                        <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Reply size={14} className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {t('email.quick_reply_to')} <span className="text-slate-900">{email.from_address}</span>
                                </span>
                            </div>
                            <button
                                onClick={() => onReply(email)}
                                className="text-slate-400 hover:text-cyan-700 p-1 rounded-md hover:bg-white transition-all"
                                title={t('email.expand_to_full_composer')}
                            >
                                <Maximize2 size={14} />
                            </button>
                        </div>
                        <div className="p-3">
                            <TextArea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={t('email.quick_reply_placeholder')}
                                className="border-none focus:ring-0 min-h-[100px] p-0 resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="px-3 py-2 border-t border-slate-50 flex justify-end gap-2 bg-slate-50/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyText('')}
                                disabled={!replyText || isSending}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<Send size={16} />}
                                iconPosition="right"
                                onClick={handleQuickReply}
                                loading={isSending}
                                disabled={!replyText.trim()}
                                className="bg-cyan-700 hover:bg-cyan-800 border-none"
                            >
                                {t('email.send')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailDetails;
