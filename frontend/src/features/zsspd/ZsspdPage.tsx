import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    Archive,
    Plus
} from 'lucide-react';
import OutgoingTab from './components/OutgoingTab';
import { Header, Button } from '../../design-system';

const ZsspdPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'archive'>('outgoing');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const tabs = [
        { id: 'outgoing', label: t('zsspd.outgoing'), icon: ArrowUpRight },
        { id: 'incoming', label: t('zsspd.incoming'), icon: ArrowDownLeft },
        { id: 'archive', label: t('zsspd.archive'), icon: Archive },
    ] as const;

    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden animate-fade-in">
            {/* Header with Design System */}
            <Header
                title={activeTab === 'outgoing' ? t('zsspd.outgoing') : activeTab === 'incoming' ? t('zsspd.incoming') : t('zsspd.archive')}
                subtitle={t('zsspd.title')}
                icon={<Package size={20} />}
                iconColor="indigo"
                tabs={tabs.map(tab => ({
                    id: tab.id,
                    label: tab.label,
                    icon: <tab.icon size={16} strokeWidth={2} />
                }))}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as 'outgoing' | 'incoming' | 'archive')}
                actions={
                    activeTab === 'outgoing' && (
                        <Button
                            variant="primary"
                            size="md"
                            icon={<Plus size={18} />}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="shadow-m3-2"
                        >
                            <span className="hidden sm:inline">{t('zsspd.new_package')}</span>
                        </Button>
                    )
                }
                sticky={true}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 custom-scrollbar">
                <div className="w-full">
                    {activeTab === 'outgoing' && (
                        <OutgoingTab
                            isModalOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                        />
                    )}
                    {activeTab === 'incoming' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-border shadow-m3-1 animate-scale-in">
                            <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-6">
                                <ArrowDownLeft className="w-10 h-10 text-muted-foreground/20" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest opacity-70">
                                {t('zsspd.no_incoming_packages')}
                            </h3>
                        </div>
                    )}
                    {activeTab === 'archive' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-border shadow-m3-1 animate-scale-in">
                            <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-6">
                                <Archive className="w-10 h-10 text-muted-foreground/20" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest opacity-70">
                                {t('zsspd.archive_empty')}
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ZsspdPage;
