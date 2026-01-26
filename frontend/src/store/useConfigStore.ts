import { create } from 'zustand';

interface AppConfig {
    app_name?: string;
    app_version?: string;
    internal_email_domain?: string;
    [key: string]: any;
}

interface ConfigState {
    showSetup: boolean;
    serverUrl: string | null;
    config: AppConfig;
    setShowSetup: (show: boolean) => void;
    setServerUrl: (url: string) => void;
    setConfig: (config: AppConfig) => void;
}

export const useConfigStore = create<ConfigState>((set): ConfigState => ({
    showSetup: false,
    serverUrl: null,
    config: {},
    setShowSetup: (show: boolean): void => set({ showSetup: show }),
    setServerUrl: (url: string): void => set({ serverUrl: url }),
    setConfig: (config: AppConfig): void => set({ config }),
}));
