import { useEffect, useState } from 'react';
import Jailbreak from 'react-native-jailbreak';
import { Platform } from 'react-native';

/**
 * Hook to detect if the device is jailbroken (iOS only).
 * Returns true if jailbroken, false otherwise.
 */
export function useJailbreakDetection() {
  const [isJailbroken, setIsJailbroken] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      Jailbreak.isJailBroken()
        .then(setIsJailbroken)
        .catch(() => setIsJailbroken(false));
    }
  }, []);

  return isJailbroken;
}
