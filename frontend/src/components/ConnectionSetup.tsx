import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface DiscoveredServer {
    id: string;
    name: string;
    url: string;
    version: string;
}

interface ConnectionSetupProps {
    onConfigured: (serverUrl: string) => void;
    initialUrl?: string;
}

const ConnectionSetup: React.FC<ConnectionSetupProps> = ({ onConfigured, initialUrl = '' }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState(initialUrl);
    const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [discoveredServers, setDiscoveredServers] = useState<DiscoveredServer[]>([]);

    React.useEffect(() => {
        if (window.electron) {
            // Initial discovery
            window.electron.discoverServers().then(setDiscoveredServers);

            // Listen for changes
            const cleanup = window.electron.onServersDiscovered((servers) => {
                setDiscoveredServers(servers);
            });
            return cleanup;
        }
    }, []);

    const checkConnection = async (overrideUrl?: string) => {
        const inputUrl = overrideUrl || url;
        if (!inputUrl) return;

        // Ensure URL has protocol
        let testUrl = inputUrl.trim();
        if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
            testUrl = `http://${testUrl}`;
        }

        // Remove trailing slash
        if (testUrl.endsWith('/')) {
            testUrl = testUrl.slice(0, -1);
        }

        setStatus('checking');
        setErrorMsg('');

        try {
            // Helper to try a specific path
            const tryPath = async (baseUrl: string) => {
                try {
                    await axios.get(`${baseUrl}/health`, { timeout: 3000 });
                    return true;
                } catch (e) {
                    if (axios.isAxiosError(e) && e.response) {
                        // If we get a response (even 404/500), the server IS reachable, 
                        // but maybe not the health endpoint. 
                        // However, usually we need a successful 200 OK for 'health'.
                        // Let's be strict about 200 for health check to ensure it's OUR server.
                    }
                    return false;
                }
            };

            let finalBaseUrl = testUrl;
            let success = false;

            // Strategy 1: Try exact URL provided (or normalized)
            // If it already ends in /api, trust it first.
            if (testUrl.endsWith('/api')) {
                if (await tryPath(testUrl)) {
                    success = true;
                    finalBaseUrl = testUrl;
                }
            } else {
                // Strategy 2: Try appending /api (most common case for seamless setup)
                // We try this FIRST if the user just gave a host:port, because our app usually lives at /api
                const urlWithApi = `${testUrl}/api`;
                if (await tryPath(urlWithApi)) {
                    success = true;
                    finalBaseUrl = urlWithApi;
                } else {
                    // Strategy 3: Try the raw URL (maybe it's a proxy that rewrites /)
                    if (await tryPath(testUrl)) {
                        success = true;
                        finalBaseUrl = testUrl;
                    }
                }
            }

            if (!success) {
                throw new Error('Server unreachable');
            }

            // Connection Successful
            setStatus('success');

            // Ensure our internal state is updated too
            setUrl(finalBaseUrl);

            // Auto-save and proceed
            if (window.electron) {
                await window.electron.saveAppConfig({ serverUrl: finalBaseUrl });
            }

            // Small delay to show success state
            setTimeout(() => {
                onConfigured(finalBaseUrl);
            }, 500);

        } catch {
            setStatus('error');
            setErrorMsg(t('connection.error_title'));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        checkConnection();
    };

    const handleSelectServer = (serverUrl: string) => {
        setUrl(serverUrl);
        // Immediately check connection with the selected URL
        checkConnection(serverUrl);
    };

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6">
            <div className="glass-card p-8 md:p-12 w-full max-w-lg relative overflow-hidden animate-in">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="mb-10 text-center relative">
                    <div className={`w-24 h-24 bg-white/80 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-2xl shadow-indigo-200/50 border border-white/50 relative
                        ${discoveredServers.length > 0 ? 'radar-ping' : ''}
                    `}>
                        <Server size={44} className="relative z-10" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                        {t('connection.main_title')}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">
                        {t('connection.subtitle')}
                    </p>
                </div>

                {discoveredServers.length > 0 && (
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                {t('connection.servers_section')}
                            </h2>
                            <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">MDNS ACTIVE</span>
                        </div>
                        <div className="grid gap-4">
                            {discoveredServers.map((server) => (
                                <button
                                    key={server.id}
                                    onClick={() => handleSelectServer(server.url)}
                                    className="group flex items-center p-5 bg-white/50 hover:bg-white border border-white/80 hover:border-indigo-200 rounded-3xl transition-all duration-300 text-left shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <Server size={24} />
                                    </div>
                                    <div className="ml-5 flex-1">
                                        <div className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{server.name}</div>
                                        <div className="text-xs font-bold text-slate-400 font-mono mt-0.5">{server.url}</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                        <ArrowRight size={20} className="text-indigo-600" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative flex items-center mb-10">
                    <div className="flex-grow border-t border-slate-200/50"></div>
                    <span className="mx-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{t('connection.or_manual_url')}</span>
                    <div className="flex-grow border-t border-slate-200/50"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="group">
                        <div className="relative">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setStatus('idle');
                                }}
                                placeholder="http://192.168.1.X:5100"
                                className={`w-full px-8 py-5 bg-white/50 border-2 rounded-3xl font-bold text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-300
                                    ${status === 'error' ? 'border-rose-200 bg-rose-50/50 focus:border-rose-500' : 'border-white/50 focus:border-indigo-500 focus:bg-white'}
                                    shadow-inner
                                `}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                {status === 'idle' && <Server size={24} />}
                                {status === 'checking' && <div className="animate-spin w-6 h-6 border-[3px] border-indigo-500 border-t-transparent rounded-full" />}
                                {status === 'success' && <CheckCircle2 size={28} className="text-emerald-500 animate-in zoom-in" />}
                                {status === 'error' && <XCircle size={28} className="text-rose-500 animate-in zoom-in" />}
                            </div>
                        </div>
                        {status === 'error' && (
                            <p className="text-rose-500 text-xs font-black mt-3 ml-2 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                {errorMsg}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!url || status === 'checking'}
                        className={`w-full py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl active:scale-[0.97]
                            ${status === 'success'
                                ? 'bg-emerald-500 text-white shadow-emerald-200'
                                : 'bg-indigo-600 text-white shadow-indigo-500/40 hover:bg-slate-900 hover:shadow-slate-900/30'
                            }
                            disabled:opacity-40 disabled:shadow-none disabled:grayscale
                        `}
                    >
                        <span>{status === 'success' ? t('connection.button_connecting') : t('connection.button_connect')}</span>
                        {status === 'success' ? <CheckCircle2 size={24} /> : <ArrowRight size={24} />}
                    </button>

                    <div className="pt-4">
                        <div className="flex items-center justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">v1.0.7</div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('connection.secure_client')}</div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConnectionSetup;
