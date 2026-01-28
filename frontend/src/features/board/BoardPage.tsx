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
                        className="shadow-m3-2"
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
                        <Loader2 className="animate-spin h-10 w-10 text-primary" />
                        <p className="font-black text-muted-foreground uppercase tracking-[0.2em] text-[10px] opacity-70">{t('common.loading')}</p>
                    </div>
                ) : (
                    <div
                        key={activeTab}
                        className="animate-slide-up"
                    >
                        <DocumentList
                            documents={activeTab === 'owned' ? (currentDocs as Document[]) : undefined}
                            type={activeTab}
                            shares={activeTab === 'received' ? (currentDocs as DocumentShare[]) : undefined}
                        />
                    </div>
                )}

                {!isLoading && currentDocs?.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 animate-scale-in">
                        <div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center border border-border shadow-m3-1 scale-110">
                            <FileText size={48} className="text-muted-foreground/30" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-sm text-muted-foreground opacity-60">
                            {t('board.no_documents')}
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
        </div>
    );
};
export default BoardPage;
