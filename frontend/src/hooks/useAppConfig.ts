import { useState, useEffect } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { setBaseUrl } from '../api/client';

export function useAppConfig() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const { showSetup, setShowSetup, setServerUrl } = useConfigStore();

  useEffect(() => {
    const initConfig = async () => {
      if (window.electron) {
        try {
          const config = await window.electron.getAppConfig();
          if (config && config.serverUrl) {
            console.log('🚀 App initializing with server URL:', config.serverUrl);
            setBaseUrl(config.serverUrl);
            setServerUrl(config.serverUrl);
            setShowSetup(false);
          } else {
            console.log('⚠️ No server URL found in config, showing setup');
            setShowSetup(true);
          }
        } catch (e) {
          console.error('❌ Failed to load config', e);
          setShowSetup(true);
        }
      } else {
        // Fallback for web dev environments (Vite dev server)
        const envUrl = import.meta.env.VITE_API_URL;
        if (envUrl) {
          setBaseUrl(envUrl);
          setServerUrl(envUrl);
        }
      }
      setIsConfigLoaded(true);
    };

    initConfig();
  }, [setServerUrl, setShowSetup]);

  return { isConfigLoaded, showSetup, setShowSetup, setServerUrl };
}
