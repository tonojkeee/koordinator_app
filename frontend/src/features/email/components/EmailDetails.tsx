import React, { useEffect, useState, useRef } from 'react';
import { emailService, type EmailMessage, type EmailFolder, type EmailMessageUpdate } from '../emailService';
import { Paperclip, Download, Star, Trash2, Reply, Forward, Printer, FileText, MoreHorizontal, AlertCircle, FolderInput, Check } from 'lucide-react';
import { Avatar } from '../../../design-system';
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
    const [email, setEmail] = useState<EmailMessage | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMoveDropdownOpen, setIsMoveDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        <div className="flex h-full items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-[#5B5FC7] border-t-transparent rounded-full animate-spin" />
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
            <div className="h-14 px-6 border-b border-[#E0E0E0] flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => email && onReply(email)}
                        className="flex items-center gap-2 px-3 py-1.5 text-[#616161] hover:bg-[#F5F5F5] rounded-md transition-colors text-sm font-medium"
                    >
                        <Reply size={18} strokeWidth={1.5} />
                        <span>{t('email.details_tooltip_reply')}</span>
                    </button>
                    <button
                        onClick={() => email && onForward(email)}
                        className="flex items-center gap-2 px-3 py-1.5 text-[#616161] hover:bg-[#F5F5F5] rounded-md transition-colors text-sm font-medium"
                    >
                        <Forward size={18} strokeWidth={1.5} />
                        <span>{t('email.details_tooltip_forward')}</span>
                    </button>
                    <div className="w-px h-6 bg-[#E0E0E0] mx-2" />
                    <button
                        onClick={() => updateEmail({ is_starred: !email.is_starred })}
                        className={`p-1.5 rounded hover:bg-[#F5F5F5] transition-colors ${email.is_starred ? 'text-amber-400' : 'text-[#888888]'}`}
                        title={email.is_starred ? t('email.remove_from_favorites') : t('email.add_to_favorites')}
                    >
                        <Star size={18} fill={email.is_starred ? "currentColor" : "none"} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => updateEmail({ is_important: !email.is_important })}
                        className={`p-1.5 rounded hover:bg-[#F5F5F5] transition-colors ${email.is_important ? 'text-[#C4314B]' : 'text-[#888888]'}`}
                        title={t('email.details_tooltip_important')}
                    >
                        <AlertCircle size={18} fill={email.is_important ? "currentColor" : "none"} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => onDelete(email.id)}
                        className="p-1.5 rounded hover:bg-rose-50 text-[#888888] hover:text-[#C4314B] transition-colors"
                        title={t('common.delete')}
                    >
                        <Trash2 size={18} strokeWidth={1.5} />
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsMoveDropdownOpen(!isMoveDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${isMoveDropdownOpen ? 'bg-[#EEF2FF] text-[#5B5FC7]' : 'text-[#616161] hover:bg-[#F5F5F5]'}`}
                            title={t('email.details_tooltip_move')}
                        >
                            <FolderInput size={18} strokeWidth={1.5} />
                            <span>{t('email.details_tooltip_move')}</span>
                        </button>

                        {isMoveDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-[#E0E0E0] z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-3 py-2 text-[10px] font-bold text-[#888888] uppercase tracking-wider border-b border-[#F5F5F5]">
                                    {t('email.folders')}
                                </div>
                                <button
                                    onClick={() => handleMoveToFolder(null)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#242424] hover:bg-[#EEF2FF] hover:text-[#5B5FC7] transition-colors"
                                >
                                    <span>{t('email.inbox')}</span>
                                    {email.folder_id === null && <Check size={14} />}
                                </button>
                                {customFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleMoveToFolder(folder.id)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#242424] hover:bg-[#EEF2FF] hover:text-[#5B5FC7] transition-colors"
                                    >
                                        <span className="truncate">{folder.name}</span>
                                        {email.folder_id === folder.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1.5 text-[#888888] hover:bg-[#F5F5F5] rounded-md transition-colors">
                        <Printer size={18} strokeWidth={1.5} />
                    </button>
                    <button className="p-1.5 text-[#888888] hover:bg-[#F5F5F5] rounded-md transition-colors">
                        <MoreHorizontal size={18} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#242424] mb-8 leading-tight">
                        {email.subject || t('email.details_no_subject')}
                    </h1>

                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Avatar name={email.from_address} size="md" className="ring-2 ring-white" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-[#242424]">{email.from_address}</span>
                                    <span className="text-xs text-[#888888] font-medium">
                                        &lt;{email.from_address}&gt;
                                    </span>
                                </div>
                                <div className="text-sm text-[#616161] mt-0.5">
                                    {t('email.details_header_to')} {email.to_address}
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-sm text-[#616161] font-medium">
                            <div>{dateStr}</div>
                            <div>{timeStr}</div>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-[#242424] leading-relaxed mb-12">
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
                        <div className="border-t border-[#E0E0E0] pt-6">
                            <h3 className="text-sm font-bold text-[#242424] mb-4 flex items-center gap-2">
                                <Paperclip size={16} className="text-[#888888]" />
                                {email.attachments.length} {t('email.details_attachment_plural')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {email.attachments.map(att => (
                                    <div key={att.id} className="flex items-center gap-3 p-3 bg-white border border-[#E0E0E0] rounded-md hover:border-[#5B5FC7] hover:bg-[#F5F5F5] transition-all cursor-pointer group shadow-sm">
                                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0 border border-[#E0E0E0] text-[#888888] group-hover:text-[#5B5FC7] transition-colors">
                                            <FileText size={20} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-[#242424] truncate">{att.filename}</div>
                                            <div className="text-[10px] font-bold text-[#888888]">{Math.round(att.file_size / 1024)} {t('common.kb')}</div>
                                        </div>
                                        <a
                                            href={`/api/email/attachments/${att.id}/download`}
                                            className="p-2 text-[#888888] hover:text-[#5B5FC7] hover:bg-[#EEF2FF] rounded transition-all opacity-0 group-hover:opacity-100"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download size={18} strokeWidth={1.5} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailDetails;
