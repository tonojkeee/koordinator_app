import React from 'react';
import { Card, Avatar } from '../../design-system';
import { MoreHorizontal, Video, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TeamsDashboard = () => {
    const { t } = useTranslation();
    
    return (
        <div className="p-6 grid grid-cols-12 gap-6 h-full overflow-y-auto bg-[#F5F5F5]">
            <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-[#242424] flex items-center gap-3">
                        <span className="bg-[#5B5FC7] text-white p-2 rounded-md shadow-sm"><MessageSquare size={20} strokeWidth={1.5} /></span>
                        {t('teams.dashboard.digital_solutions') || 'Digital Solutions Team'}
                    </h1>
                    <button className="p-2 hover:bg-white rounded-md text-[#616161] transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-4 mb-6">
                    <div className="flex items-center gap-6 text-sm font-semibold text-[#616161] border-b border-[#E0E0E0] pb-0 mb-4">
                        <span className="text-[#5B5FC7] border-b-[3px] border-[#5B5FC7] pb-3 px-1 cursor-pointer">{t('teams.dashboard.posts')}</span>
                        <span className="hover:text-[#242424] pb-3 px-1 cursor-pointer transition-colors">{t('teams.dashboard.files')}</span>
                        <span className="hover:text-[#242424] pb-3 px-1 cursor-pointer transition-colors">{t('teams.dashboard.tasks')}</span>
                        <span className="hover:text-[#242424] pb-3 px-1 cursor-pointer transition-colors">{t('teams.dashboard.wiki')}</span>
                    </div>

                    <div className="bg-[#EEF2FF] rounded-md p-4 flex items-center justify-between border border-[#E0E7FF]">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2.5 rounded-full text-[#5B5FC7] shadow-sm">
                                <Video size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#242424]">{t('teams.dashboard.sprint_review_time') || 'Sprint Review at 2:00 PM'}</h3>
                                <p className="text-xs text-[#5B5FC7] font-medium">{t('teams.dashboard.dont_forget_updates') || "Don't forget to bring your updates."}</p>
                            </div>
                        </div>
                        <button className="px-4 py-1.5 bg-[#5B5FC7] text-white text-sm font-semibold rounded-md hover:bg-[#4f52b2] transition-colors shadow-sm">
                            {t('teams.dashboard.join_meeting')}
                        </button>
                    </div>
                </div>

                <PostCard
                    author="Michael Ivanov"
                    time="10:42 AM"
                    content={t('teams.dashboard.mock_post_1') || "Design mockups updated. Take a look! 🎨"}
                    isPrimary
                    reactions={[{ emoji: '👍', count: 5 }, { emoji: '🤩', count: 5 }]}
                />

                <PostCard
                    author="Natalia Orlovac"
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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#616161]">{t('chat.today')} • 2:00 PM - 3:00 PM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <Avatar key={i} name={`User ${i}`} size="sm" className="ring-2 ring-white" />
                                ))}
                            </div>
                            <span className="text-sm font-bold text-[#242424] ml-2">5 {t('teams.dashboard.meeting_participants')}</span>
                        </div>
                    </div>
                </Widget>

                <Widget title={t('teams.dashboard.prepare_meeting')}>
                    <div className="space-y-3">
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
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                         {[1,2,3,4].map(i => (
                            <div key={i} className="flex flex-col items-center min-w-[64px]">
                                <Avatar name={`Member ${i}`} size="md" status="online" />
                                <span className="text-[11px] font-medium text-[#424242] mt-1 truncate w-full text-center">{t('users.employee')} {i}</span>
                            </div>
                        ))}
                    </div>
                </Widget>
            </div>
        </div>
    );
};

const Widget = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card className="p-4 border-[#E0E0E0] shadow-sm rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#242424] text-sm uppercase tracking-wide opacity-90">{title}</h3>
            <button className="text-[#888888] hover:text-[#242424]">
                <MoreHorizontal size={16} />
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
    <Card className={`p-4 border-[#E0E0E0] shadow-sm rounded-lg ${isPrimary ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
        <div className="flex gap-3">
            <Avatar name={author} size="md" />
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <h4 className="font-bold text-[#242424] text-sm">{author}</h4>
                    <span className="text-xs text-[#888888]">{time}</span>
                </div>
                <div className="mt-1 text-[#424242] text-sm leading-relaxed">
                    {content}
                </div>
                {image && (
                    <div className="mt-3 rounded-md overflow-hidden border border-[#E0E0E0]">
                        <img src={image} alt="Post attachment" className="w-full h-auto" />
                    </div>
                )}
                {reactions && (
                    <div className="flex gap-2 mt-3">
                        {reactions.map((r, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white border border-[#E0E0E0] px-2 py-0.5 rounded-full text-xs font-medium text-[#616161] shadow-sm">
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </Card>
);

const CheckItem = ({ label, checked }: { label: string, checked?: boolean }) => (
    <div className="flex items-center gap-3 group cursor-pointer hover:bg-[#F5F5F5] p-2 rounded-md -mx-2 transition-colors">
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-[#5B5FC7] border-[#5B5FC7] text-white' : 'border-[#BDBDBD]'}`}>
            {checked && <CheckSquare size={14} fill="currentColor" className="text-white" strokeWidth={3} />}
        </div>
        <span className={`text-sm ${checked ? 'text-[#888888] line-through' : 'text-[#242424] font-medium'}`}>{label}</span>
    </div>
);

const FileItem = ({ name, type }: { name: string, type: string }) => {
    const color = type === 'pdf' ? 'text-[#C4314B]' : 'text-[#D95F18]';
    return (
        <div className="flex items-center gap-3 p-2 hover:bg-[#F5F5F5] rounded-md transition-colors cursor-pointer group -mx-2">
            <div className="w-8 h-8 flex items-center justify-center bg-white border border-[#E0E0E0] rounded">
                <FileText size={16} className={color} strokeWidth={2} />
            </div>
            <span className="text-sm text-[#424242] group-hover:text-[#5B5FC7] font-medium truncate">{name}</span>
        </div>
    );
};
