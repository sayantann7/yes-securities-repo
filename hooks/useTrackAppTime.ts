import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthContext';

const API_URL = 'http://192.168.3.154:3000/user';

// For testing: reduce minimum duration from 1 minute to 10 seconds
const MIN_SESSION_DURATION_MS = 10 * 1000; // 10 seconds for testing
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // Send heartbeat every 30 seconds

export function useTrackAppTime() {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const sessionStart = useRef<number | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add a manual test function (for development/testing only)
  const testTimeTracking = async () => {
    if (user?.email) {
      console.log('[AppTime] Manual test - sending 5 minutes to backend');
      try {
        const response = await fetch(`${API_URL}/updateTime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            timeSpent: 5, // 5 minutes for testing
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AppTime] Manual test successful:', data);
        } else {
          console.error('[AppTime] Manual test failed:', response.status);
        }
      } catch (err) {
        console.error('[AppTime] Manual test error:', err);
      }
    }
  };

  // Add a function to check current user stats (for debugging)
  const checkUserStats = async () => {
    if (user?.email) {
      try {
        console.log('[AppTime] Checking user stats for:', user.email);
        const response = await fetch(`${API_URL}/userDetails?userEmail=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AppTime] Current user stats:', {
            timeSpent: data.user.timeSpent,
            documentsViewed: data.user.documentsViewed,
            numberOfSignIns: data.user.numberOfSignIns
          });
        } else {
          console.error('[AppTime] Failed to fetch user stats:', response.status);
        }
      } catch (err) {
        console.error('[AppTime] Error fetching user stats:', err);
      }
    }
  };

  // Expose test function globally for debugging (development only)
  useEffect(() => {
    if (__DEV__ && user?.email) {
      (global as any).testTimeTracking = testTimeTracking;
      (global as any).checkUserStats = checkUserStats;
      console.log('[AppTime] Debug functions available:');
      console.log('  - global.testTimeTracking() - sends 5 minutes to backend');
      console.log('  - global.checkUserStats() - shows current user stats');
    }
  }, [user?.email]);

  useEffect(() => {
    console.log('[AppTime] useEffect triggered with user:', user?.email);
    if (!user?.email) {
      console.log('[AppTime] No user email, returning early');
      return;
    }

    console.log('[AppTime] Setting up app state tracking for user:', user.email);

    const sendTimeToBackend = async (durationMs: number, label = '') => {
      const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60))); // Ensure at least 1 minute
      console.log(`[AppTime] Sending ${label} duration to backend:`, durationMinutes, 'minutes (', durationMs, 'ms )');
      
      try {
        const response = await fetch(`${API_URL}/updateTime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            timeSpent: durationMinutes,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AppTime] Backend responded with error:', response.status, errorText);
        } else {
          const responseData = await response.json();
          console.log(`[AppTime] Successfully sent ${label} duration to backend:`, responseData);
        }
      } catch (err) {
        console.error(`[AppTime] Failed to update ${label} time spent:`, err);
      }
    };

    const startHeartbeat = () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      console.log('[AppTime] Starting heartbeat timer');
      heartbeatInterval.current = setInterval(() => {
        if (sessionStart.current && appState.current === 'active') {
          const durationMs = Date.now() - sessionStart.current;
          console.log('[AppTime] Heartbeat - Current session duration:', Math.round(durationMs / 1000), 'seconds');
          
          // Send incremental time every 30 seconds
          if (durationMs >= MIN_SESSION_DURATION_MS) {
            sendTimeToBackend(HEARTBEAT_INTERVAL_MS, 'heartbeat');
            // Reset session start to avoid double counting
            sessionStart.current = Date.now();
          }
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    const stopHeartbeat = () => {
      if (heartbeatInterval.current) {
        console.log('[AppTime] Stopping heartbeat timer');
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('[AppTime] App state changed from', appState.current, 'to', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        sessionStart.current = Date.now();
        console.log('[AppTime] Timer started at', new Date(sessionStart.current).toISOString());
        startHeartbeat();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to the background
        stopHeartbeat();
        
        if (sessionStart.current) {
          const durationMs = Date.now() - sessionStart.current;
          console.log('[AppTime] Timer stopped at', new Date().toISOString(), 'Duration:', Math.round(durationMs / 1000), 'seconds');
          
          if (durationMs >= MIN_SESSION_DURATION_MS) {
            await sendTimeToBackend(durationMs, 'background');
          } else {
            console.log('[AppTime] Duration too short, not sending to backend');
          }
        } else {
          console.log('[AppTime] No session start time recorded');
        }
        sessionStart.current = null;
      }
      appState.current = nextAppState;
    };

    // Start session if app is already active
    if (appState.current === 'active') {
      sessionStart.current = Date.now();
      console.log('[AppTime] Timer started at', new Date(sessionStart.current).toISOString(), '(initial)');
      startHeartbeat();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    console.log('[AppTime] App state listener set up successfully');

    return () => {
      console.log('[AppTime] Cleaning up app time tracking');
      stopHeartbeat();
      
      // On cleanup, if session is running, send the time
      if (sessionStart.current) {
        const durationMs = Date.now() - sessionStart.current;
        console.log('[AppTime] Timer stopped at', new Date().toISOString(), 'Duration:', Math.round(durationMs / 1000), 'seconds (cleanup)');
        
        if (durationMs >= MIN_SESSION_DURATION_MS) {
          console.log('[AppTime] Sending cleanup duration to backend');
          sendTimeToBackend(durationMs, 'cleanup')
            .catch(err => console.error('[AppTime] Cleanup request error:', err));
        }
      }
      subscription.remove();
    };
  }, [user?.email]);
}