import React from 'react';
import { Card, Avatar, Header, Button, cn } from '../../design-system';
import { MoreHorizontal, Video, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TeamsDashboard = () => {
    const { t } = useTranslation();
    
    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden animate-fade-in">
            {/* Header */}
            <Header
                title={t('teams.dashboard.digital_solutions') || 'Digital Solutions Team'}
                subtitle="Software Development"
                icon={<MessageSquare size={20} strokeWidth={2} />}
                iconColor="indigo"
                sticky={true}
                actions={
                    <button className="p-2.5 hover:bg-surface-3 rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-90">
                        <MoreHorizontal size={20} strokeWidth={2.5} />
                    </button>
                }
                tabs={[
                    { id: 'posts', label: t('teams.dashboard.posts'), icon: <MessageSquare size={16} strokeWidth={2} /> },
                    { id: 'files', label: t('teams.dashboard.files'), icon: <FileText size={16} strokeWidth={2} /> },
                    { id: 'tasks', label: t('teams.dashboard.tasks'), icon: <CheckSquare size={16} strokeWidth={2} /> },
                    { id: 'wiki', label: t('teams.dashboard.wiki'), icon: <FileText size={16} strokeWidth={2} /> }
                ]}
                activeTab="posts"
            />

            <div className="flex-1 overflow-y-auto px-6 pb-10 pt-2 custom-scrollbar">
                <div className="grid grid-cols-12 gap-6 h-full max-w-7xl mx-auto animate-slide-up">
                    <div className="col-span-12 lg:col-span-8 space-y-6">

                        <div className="bg-primary/5 rounded-lg p-5 flex items-center justify-between border border-primary/10 shadow-m3-1 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
                            <div className="flex items-center gap-5">
                                <div className="bg-surface p-3 rounded-lg text-primary shadow-m3-1 group-hover:scale-110 transition-transform duration-500">
                                    <Video size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="font-black text-foreground tracking-tight uppercase tracking-[0.05em]">{t('teams.dashboard.sprint_review_time') || 'Sprint Review at 2:00 PM'}</h3>
                                    <p className="text-xs text-primary font-bold opacity-80">{t('teams.dashboard.dont_forget_updates') || "Don't forget to bring your updates."}</p>
                                </div>
                            </div>
                            <Button variant="primary" size="md" className="font-black uppercase tracking-widest text-[10px] shadow-m3-2 px-6">
                                {t('teams.dashboard.join_meeting')}
                            </Button>
                        </div>

                        <PostCard
                            author="Michael Ivanov"
                            time="10:42 AM"
                            content={t('teams.dashboard.mock_post_1') || "Design mockups updated. Take a look! 🎨"}
                            isPrimary
                            reactions={[{ emoji: '👍', count: 5 }, { emoji: '🤩', count: 5 }]}
                        />

                        <PostCard
                            author="Natalia Orlova"
                            time="10:50 AM"
                            content={t('teams.dashboard.mock_post_2') || "Great, I'll review the new mockups! This looks fantastic."}
                            reactions={[{ emoji: '👍', count: 2 }, { emoji: '✅', count: 1 }]}
                        />

                        <PostCard
                            author="Alexey Smirnov"
                            time="11:15 AM"
                            content={t('teams.dashboard.mock_post_3') || "Reminder: Client presentation tomorrow at 3 PM. Be prepared!"}
                        />
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <Widget title={t('teams.dashboard.sprint_review_meeting') || "Sprint Review Meeting"}>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-70">{t('chat.today')} • 2:00 PM - 3:00 PM</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <Avatar key={i} name={`User ${i}`} size="sm" className="ring-4 ring-surface shadow-sm" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-foreground uppercase tracking-widest">5 {t('teams.dashboard.meeting_participants')}</span>
                                </div>
                            </div>
                        </Widget>

                        <Widget title={t('teams.dashboard.prepare_meeting')}>
                            <div className="space-y-1">
                                <CheckItem label={t('teams.dashboard.review_mockups')} checked />
                                <CheckItem label={t('teams.dashboard.finalize_report')} checked />
                                <CheckItem label={t('teams.dashboard.discuss_feedback')} checked />
                            </div>
                        </Widget>

                        <Widget title={t('teams.dashboard.shared_files')}>
                            <div className="space-y-1">
                                <FileItem name="Project Timeline v2.pdf" type="pdf" />
                                <FileItem name="Design Mockups.pptx" type="pptx" />
                                <FileItem name="Client Presentation Deck.pptx" type="pptx" />
                            </div>
                        </Widget>

                        <Widget title={t('teams.dashboard.members')}>
                            <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex flex-col items-center min-w-[72px] group/member">
                                        <Avatar name={`Member ${i}`} size="md" status="online" className="shadow-sm group-hover/member:ring-4 group-hover/member:ring-primary/10 transition-all duration-300" />
                                        <span className="text-[10px] font-black text-muted-foreground mt-2 truncate w-full text-center uppercase tracking-widest opacity-60 group-hover/member:opacity-100 group-hover/member:text-primary">{t('users.employee')} {i}</span>
                                    </div>
                                ))}
                            </div>
                        </Widget>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Widget = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card className="p-5 border-border shadow-m3-1 rounded-lg bg-surface hover:shadow-m3-2 transition-all duration-300">
        <div className="flex justify-between items-center mb-5">
            <h3 className="font-black text-foreground text-[10px] uppercase tracking-[0.2em] opacity-80">{title}</h3>
            <button className="text-muted-foreground hover:text-primary transition-colors p-1">
                <MoreHorizontal size={14} strokeWidth={3} />
            </button>
        </div>
        {children}
    </Card>
);

const PostCard = ({ author, time, content, reactions, isPrimary, image }: {
    author: string;
    time: string;
    content: string;
    reactions?: { emoji: string; count: number }[];
    isPrimary?: boolean;
    image?: string
}) => (
    <Card className={cn(
        "p-5 border-border shadow-m3-1 rounded-lg transition-all duration-500 hover:shadow-teams-card group",
        isPrimary ? 'bg-surface border-primary/10 ring-1 ring-primary/5' : 'bg-surface-1 hover:bg-surface'
    )}>
        <div className="flex gap-4">
            <Avatar name={author} size="md" className="shadow-sm border border-border/50" />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1.5">
                    <h4 className="font-black text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">{author}</h4>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">{time}</span>
                </div>
                <div className="text-foreground/90 text-sm leading-relaxed font-bold">
                    {content}
                </div>
                {image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-border shadow-sm group-hover:shadow-m3-1 transition-all duration-500">
                        <img src={image} alt="Post attachment" className="w-full h-auto" />
                    </div>
                )}
                {reactions && (
                    <div className="flex gap-2 mt-4">
                        {reactions.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1 rounded-full text-xs font-black text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary transition-all cursor-pointer">
                                <span>{r.emoji}</span>
                                <span className="tabular-nums">{r.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </Card>
);

const CheckItem = ({ label, checked }: { label: string, checked?: boolean }) => (
    <div className="flex items-center gap-3 group cursor-pointer hover:bg-surface-2 p-2.5 rounded-xl transition-all active:scale-[0.98]">
        <div className={cn(
            "w-5 h-5 rounded-lg border transition-all flex items-center justify-center",
            checked ? 'bg-primary border-primary text-white shadow-m3-1' : 'border-border bg-surface'
        )}>
            {checked && <CheckSquare size={14} strokeWidth={3} />}
        </div>
        <span className={cn(
            "text-xs uppercase tracking-widest transition-all",
            checked ? 'text-muted-foreground/50 line-through font-bold' : 'text-foreground font-black'
        )}>{label}</span>
    </div>
);

const FileItem = ({ name, type }: { name: string, type: string }) => {
    const color = type === 'pdf' ? 'text-destructive' : 'text-amber-600';
    return (
        <div className="flex items-center gap-3 p-2.5 hover:bg-surface-2 rounded-xl transition-all cursor-pointer group active:scale-[0.98]">
            <div className="w-9 h-9 flex items-center justify-center bg-surface border border-border rounded-xl shadow-sm group-hover:shadow-m3-1 transition-all group-hover:scale-110">
                <FileText size={18} className={color} strokeWidth={2} />
            </div>
            <span className="text-xs text-foreground font-black group-hover:text-primary transition-colors truncate uppercase tracking-widest opacity-80 group-hover:opacity-100">{name}</span>
        </div>
    );
};
