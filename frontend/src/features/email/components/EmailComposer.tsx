import React, { useState, useRef, useEffect } from 'react';
import { emailService, type SendEmailData } from '../emailService';
import type { User } from '../../../types';
import { X, Send, Paperclip, FileText, AlertCircle, Bold, Italic, List, Link, AlignLeft, Image, Underline, Strikethrough, Quote, AlignCenter, AlignRight, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { Modal, Button, cn } from '../../../design-system';
import { useTranslation } from 'react-i18next';

interface EmailComposerProps {
    onClose: () => void;
    onSent: () => void;
    initialTo?: string;
    initialSubject?: string;
    initialBody?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ onClose, onSent, initialTo, initialSubject, initialBody }) => {
    const { t } = useTranslation();
    // Form State
    const [subject, setSubject] = useState(initialSubject || '');
    const [body, setBody] = useState(initialBody || '');
    const [recipientInput, setRecipientInput] = useState('');
    const [recipients, setRecipients] = useState<string[]>(initialTo ? [initialTo] : []);
    const [files, setFiles] = useState<File[]>([]);
    const [isImportant, setIsImportant] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const recipientInputRef = useRef<HTMLInputElement>(null);

    // Fetch settings for limits
    const { data: settings } = useQuery({
        queryKey: ['public-settings'],
        queryFn: async () => (await api.get('/admin/public-settings')).data,
        staleTime: 5 * 60 * 1000,
    });

    const maxTotalSizeMb = settings?.email_max_total_attachment_size_mb ? parseInt(settings.email_max_total_attachment_size_mb) : 50;
    const maxTotalSizeBytes = maxTotalSizeMb * 1024 * 1024;

    // Initialize editor content
    useEffect(() => {
        if (editorRef.current && initialBody) {
            editorRef.current.innerHTML = initialBody;
        }
    }, []);

    // Initial load of address book for autocomplete
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await emailService.getAddressBook();
                setAllUsers(users);
            } catch (err) {
                console.error("Failed to load users for autocomplete", err);
            }
        };
        loadUsers();
    }, []);

    // Focus recipient input when modal opens
    useEffect(() => {
        const timer = setTimeout(() => {
            if (recipientInputRef.current) {
                recipientInputRef.current.focus();
            }
        }, 150); // Slightly longer delay than Modal's focus management

        return () => clearTimeout(timer);
    }, []);

    // Handle outside click for suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter suggestions
    useEffect(() => {
        if (recipientInput.trim().length > 0) {
            const lower = recipientInput.toLowerCase();
            const matches = allUsers.filter(u =>
                (u.email && u.email.toLowerCase().includes(lower)) ||
                (u.full_name && u.full_name.toLowerCase().includes(lower)) ||
                (u.username && u.username.toLowerCase().includes(lower))
            ).slice(0, 5);
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [recipientInput, allUsers]);

    const addRecipient = (email: string) => {
        if (email && !recipients.includes(email)) {
            setRecipients([...recipients, email]);
        }
        setRecipientInput('');
        setShowSuggestions(false);
    };

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r !== email));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (['Enter', ',', 'Tab'].includes(e.key)) {
            e.preventDefault();
            if (recipientInput.trim()) {
                // Simple email validation could go here
                addRecipient(recipientInput.trim());
            }
        } else if (e.key === 'Backspace' && !recipientInput && recipients.length > 0) {
            removeRecipient(recipients[recipients.length - 1]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            // Calculate total size including current files
            const currentTotal = files.reduce((acc, f) => acc + f.size, 0);
            const newTotal = newFiles.reduce((acc, f) => acc + f.size, 0);

            if (currentTotal + newTotal > maxTotalSizeBytes) {
                alert(t('email.compose.size_limit', { size: maxTotalSizeMb }));
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setFiles(prev => [...prev, ...newFiles]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setBody(editorRef.current.innerHTML);
        }
    };

    const handleLink = () => {
        const url = prompt(t('email.compose.enter_link_url') || 'Enter URL:', 'https://');
        if (url) handleFormat('createLink', url);
    };

    const handleImage = () => {
        const url = prompt(t('email.compose.enter_image_url') || 'Enter Image URL:', 'https://');
        if (url) handleFormat('insertImage', url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (recipients.length === 0) {
            alert(t('email.compose.at_least_one_recipient'));
            return;
        }

        setLoading(true);
        try {
            const emailData: SendEmailData = {
                to_address: recipients.join(', '),
                subject,
                body_text: editorRef.current?.innerText || '',
                body_html: body,
                attachments: files,
                is_important: isImportant
            };

            await emailService.sendEmail(emailData);
            onSent();
            onClose();
        } catch (error) {
            console.error("Error sending email:", error);
            alert(t('email.compose.send_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-slate-900">{t('email.compose.title')}</span>
                </div>
            }
            size="xl"
            closeOnOverlayClick={false}
            footer={
                <div className="flex items-center justify-between w-full border-t border-slate-100 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                            title={t('email.compose.attach')}
                        >
                            <Paperclip size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsImportant(!isImportant)}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                isImportant ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'
                            )}
                            title={t('email.important')}
                        >
                            <AlertCircle size={20} fill={isImportant ? "currentColor" : "none"} />
                        </button>

                        {files.length > 0 && (
                            <div className="ml-2 text-xs font-medium text-slate-400">
                                <span className={totalSize > maxTotalSizeBytes ? "text-rose-600" : ""}>
                                    {(totalSize / (1024 * 1024)).toFixed(1)}MB / {maxTotalSizeMb}MB
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            {t('email.compose.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading || recipients.length === 0}
                            loading={loading}
                            onClick={handleSubmit}
                            className="bg-cyan-700 hover:bg-cyan-800 text-white px-6 py-2 rounded-lg shadow-sm font-medium flex items-center gap-2"
                        >
                            <span>{loading ? t('email.compose.sending') : t('email.compose.send')}</span>
                            {!loading && <Send size={16} />}
                        </Button>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-[500px]">
                {/* Recipients */}
                <div className="relative flex items-start border-b border-slate-100 min-h-[52px] group transition-colors focus-within:bg-slate-50/50">
                    <label
                        className="text-xs font-bold text-slate-500 w-24 shrink-0 pt-3.5 pl-1 select-none cursor-pointer"
                        onClick={() => recipientInputRef.current?.focus()}
                    >
                        {t('email.compose.recipients')}
                    </label>
                    <div
                        className="flex-1 flex flex-wrap gap-2 items-center cursor-text py-2.5"
                        onClick={() => recipientInputRef.current?.focus()}
                    >
                        {recipients.map(email => (
                            <div key={email} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm border border-slate-200/50 transition-colors hover:border-slate-300">
                                <span className="max-w-[200px] truncate">{email}</span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeRecipient(email); }}
                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <input
                            ref={recipientInputRef}
                            type="text"
                            className="flex-1 bg-transparent min-w-[120px] outline-none text-sm text-slate-900 placeholder:text-slate-400 py-1"
                            placeholder={recipients.length === 0 ? t('email.compose.recipients_placeholder') : ""}
                            value={recipientInput}
                            onChange={e => setRecipientInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div ref={suggestionsRef} className="absolute left-16 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            {suggestions.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => user.email && addRecipient(user.email)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors group/item"
                                >
                                    <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xs border border-cyan-100/50">
                                        {user.full_name?.[0] || user.username[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900 group-hover/item:text-cyan-700 transition-colors">{user.full_name || user.username}</span>
                                        <span className="text-xs text-slate-500">{user.email}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subject */}
                <div className="flex items-center border-b border-slate-100 h-[52px] transition-colors focus-within:bg-slate-50/50">
                    <label
                        className="text-xs font-bold text-slate-500 w-24 shrink-0 pl-1 select-none cursor-pointer"
                        htmlFor="subject-input"
                    >
                        {t('email.compose.subject')}
                    </label>
                    <input
                        id="subject-input"
                        placeholder={t('email.compose.subject_placeholder')}
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 py-1 font-medium"
                    />
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-0.5 py-2 border-b border-slate-50 bg-slate-50/30 px-1">
                    {/* Group 1: Text Styling */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('bold')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_bold')}
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('italic')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_italic')}
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('underline')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_underline')}
                    >
                        <Underline size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('strikeThrough')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_strikethrough')}
                    >
                        <Strikethrough size={16} />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* Group 2: Lists & Blocks */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('insertUnorderedList')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_list')}
                    >
                        <List size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('formatBlock', 'blockquote')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_quote')}
                    >
                        <Quote size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('insertHorizontalRule')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_horizontal_rule')}
                    >
                        <Minus size={16} />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* Group 3: Alignment */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('justifyLeft')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_align_left')}
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('justifyCenter')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_align_center')}
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFormat('justifyRight')}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_align_right')}
                    >
                        <AlignRight size={16} />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* Group 4: Links & Media */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleLink}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_link')}
                    >
                        <Link size={16} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleImage}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all"
                        title={t('email.compose.tool_image')}
                    >
                        <Image size={16} />
                    </button>
                </div>

                {/* Body */}
                <div
                    className="flex-1 py-4 overflow-hidden flex flex-col cursor-text"
                    onClick={() => editorRef.current?.focus()}
                >
                    <div
                        ref={editorRef}
                        contentEditable="true"
                        onInput={(e) => setBody(e.currentTarget.innerHTML)}
                        className="flex-1 w-full min-h-[300px] bg-transparent outline-none text-base text-slate-800 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 leading-relaxed custom-scrollbar overflow-y-auto px-1"
                        data-placeholder={t('email.compose.message_placeholder')}
                    />
                </div>

                {/* Files List */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-4 border-t border-slate-100">
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 pl-2 pr-1 py-1.5 rounded-lg border border-slate-200 group transition-all hover:bg-white hover:border-cyan-200 hover:shadow-sm">
                                <div className="w-7 h-7 rounded bg-white text-slate-400 flex items-center justify-center border border-slate-100 group-hover:text-cyan-600 transition-colors">
                                    <FileText size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-medium text-slate-900 truncate max-w-[120px]">{file.name}</span>
                                    <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default EmailComposer;
