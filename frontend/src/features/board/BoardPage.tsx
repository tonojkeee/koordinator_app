import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, Loader2, Inbox } from 'lucide-react';
import { useDocumentsOwned, useDocumentsReceived } from './boardApi';
import type { Document, DocumentShare } from './types';
import DocumentList from './components/DocumentList';
import UploadModal from './components/UploadModal';
import { Header, Button } from '../../design-system';

const BoardPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'owned' | 'received'>('owned');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: ownedDocs, isLoading: ownedLoading } = useDocumentsOwned();
    const { data: receivedDocs, isLoading: receivedLoading } = useDocumentsReceived();

    const isLoading = activeTab === 'owned' ? ownedLoading : receivedLoading;
    const currentDocs = activeTab === 'owned'
        ? ownedDocs?.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : receivedDocs?.filter(s => s.document.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden animate-fade-in">
            {/* Header */}
            <Header
                title={activeTab === 'owned' ? t('board.my_documents') : t('board.received_documents')}
                subtitle={t('board.title')}
                icon={<FileText size={20} />}
                iconColor="indigo"
                searchPlaceholder={t('board.search_placeholder')}
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSearchClear={() => setSearchQuery('')}
                tabs={[
                    { id: 'owned', label: t('board.my_documents'), icon: <FileText size={16} strokeWidth={2} />, badge: ownedDocs?.length },
                    { id: 'received', label: t('board.received_documents'), icon: <Inbox size={16} strokeWidth={2} />, badge: receivedDocs?.length }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as 'owned' | 'received')}
                actions={
                    <Button
                        variant="primary"
                        icon={<Upload size={16} />}
                        onClick={() => setIsUploadModalOpen(true)}
                        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-medium)' }}
                    >
                        {t('board.upload')}
                    </Button>
                }
                sticky={true}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
                        <Loader2 className="animate-spin h-10 w-10 text-[hsl(210_95%_42%)]" />
                        <p className="font-black text-[hsl(220_12%_47%)] uppercase tracking-[0.2em] text-[10px] opacity-70">{t('common.loading')}</p>
                    </div>
                ) : (
                    <div
                        key={activeTab}
                        className="animate-in"
                    >
                        <DocumentList
                            documents={activeTab === 'owned' ? (currentDocs as Document[]) : undefined}
                            type={activeTab}
                            shares={activeTab === 'received' ? (currentDocs as DocumentShare[]) : undefined}
                        />
                    </div>
                )}

                {!isLoading && currentDocs?.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 animate-zoom-in">
                        <div
                            className="w-28 h-28 bg-surface-2 flex items-center justify-center border border-border shadow-subtle"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <FileText size={56} className="text-tertiary/30" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-sm text-secondary">
                            {t('board.no_documents')}
                        </p>
                        <p className="text-xs font-bold text-tertiary/60 max-w-sm text-center">
                            {activeTab === 'owned' ? t('board.no_documents_hint_owned') : t('board.no_documents_hint_received')}
                        </p>
                        <Button
                            variant="primary"
                            icon={<Upload size={16} />}
                            onClick={() => setIsUploadModalOpen(true)}
                            className="shadow-subtle hover:shadow-medium hover:-translate-y-0.5 active:shadow-subtle active:translate-y-0.5 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {t('board.upload')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
        </div>
    );
};
export default BoardPage;
