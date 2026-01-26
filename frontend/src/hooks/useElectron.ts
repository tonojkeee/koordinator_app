import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentViewer } from '../features/board/store/useDocumentViewer';

export function useElectronListeners() {
  const navigate = useNavigate();
  const closeViewer = useDocumentViewer(state => state.close);

  useEffect(() => {
    const electron = window.electron;
    if (electron) {
      // Handle deep links (gis-coordinator://...)
      const PROTOCOL = 'gis-coordinator';
      const cleanupOpenUrl = electron.onOpenUrl((url: string) => {
        const path = url.replace(`${PROTOCOL}://`, '/');
        navigate(path);
      });

      // System Tray / Global Shortcut: Quick Search
      const cleanupTriggerSearch = electron.onTriggerSearch(() => {
        // Navigate to archive or global search
        navigate('/archive?search=true');
      });

      // System Tray: Quick Upload
      const cleanupTriggerUpload = electron.onTriggerUpload(() => {
        navigate('/archive?upload=true');
      });

      // System Notification Clicked
      const cleanupNotificationClicked = electron.onNotificationClicked((data: Record<string, unknown>) => {
        if (data && typeof data.url === 'string') {
          navigate(data.url);
        } else {
          electron.focusWindow();
        }
      });

      // Global keyboard shortcuts (local to app window)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeViewer();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (cleanupOpenUrl) cleanupOpenUrl();
        if (cleanupTriggerSearch) cleanupTriggerSearch();
        if (cleanupTriggerUpload) cleanupTriggerUpload();
        if (cleanupNotificationClicked) cleanupNotificationClicked();
      };
    }
  }, [navigate, closeViewer]);
}
