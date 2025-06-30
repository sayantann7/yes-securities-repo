import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthContext';

const API_URL = 'http://192.168.1.103:3000/user';

export function useTrackAppTime() {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const sessionStart = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        sessionStart.current = Date.now();
        console.log('[AppTime] Timer started at', new Date(sessionStart.current).toISOString());
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to the background
        if (sessionStart.current) {
          const durationMs = Date.now() - sessionStart.current;
          const durationSec = Math.round(durationMs / 1000);
          console.log('[AppTime] Timer stopped at', new Date().toISOString(), 'Duration:', durationSec, 'seconds');
          if (durationSec > 0) {
            try {
              console.log('[AppTime] Sending duration to backend:', durationSec, 'seconds');
              await fetch(`${API_URL}/updateTime`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userEmail: user.email,
                  timeSpent: durationSec,
                }),
              });
              console.log('[AppTime] Successfully sent duration to backend');
            } catch (err) {
              console.error('[AppTime] Failed to update time spent:', err);
            }
          }
        }
        sessionStart.current = null;
      }
      appState.current = nextAppState;
    };

    // Start session if app is already active
    if (appState.current === 'active') {
      sessionStart.current = Date.now();
      console.log('[AppTime] Timer started at', new Date(sessionStart.current).toISOString());
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // On cleanup, if session is running, send the time
      if (sessionStart.current) {
        const durationMs = Date.now() - sessionStart.current;
        const durationSec = Math.round(durationMs / 1000);
        console.log('[AppTime] Timer stopped at', new Date().toISOString(), 'Duration:', durationSec, 'seconds (cleanup)');
        if (durationSec > 0) {
          console.log('[AppTime] Sending duration to backend (cleanup):', durationSec, 'seconds');
          fetch(`${API_URL}/updateTime`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: user.email,
              timeSpent: durationSec,
            }),
          })
            .then(() => console.log('[AppTime] Successfully sent duration to backend (cleanup)'))
            .catch(() => {});
        }
      }
      subscription.remove();
    };
  }, [user?.email]);
} 