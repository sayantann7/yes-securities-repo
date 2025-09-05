import { useEffect, useState } from 'react';
import { Alert, Platform, NativeModules } from 'react-native';
import * as Constants from 'expo-constants';
import { useJailbreakDetection } from './useJailbreakDetection';

export interface RootHeuristicsResult {
  rooted: boolean | null;        // null while evaluating
  riskScore: number;             // accumulated heuristic score
  reasons: string[];             // triggered heuristic labels
  details: Record<string, any>;  // raw info snapshot (safe primitives only)
  evaluatedAt?: string;          // ISO timestamp when completed
}

interface Options { onBlocked?: () => void; threshold?: number; showAlert?: boolean; }

// Extract primitive snapshot for logging / analytics (avoid large / sensitive objects)
function snapshotInfo(): Record<string, any> {
  const out: Record<string, any> = {};
  try { out.platform = Platform.OS; } catch {}
  try { out.release = (Platform as any).Version; } catch {}
  try { out.constantsDeviceName = (Constants as any).deviceName; } catch {}
  try { out.executionEnvironment = (Constants as any).executionEnvironment; } catch {}
  try { out.appOwnership = (Constants as any).appOwnership; } catch {}
  const pm: any = (NativeModules as any).PlatformConstants || (NativeModules as any).RNPlatformConstants || {};
  try { out.fingerprint = pm.Fingerprint || pm.fingerprint; } catch {}
  try { out.manufacturer = pm.Manufacturer || pm.manufacturer; } catch {}
  try { out.model = pm.Model || pm.model; } catch {}
  return out;
}

function evaluateHeuristics(info: Record<string, any>) {
  const reasons: string[] = [];
  let score = 0;

  const fp: string = (info.fingerprint || '').toString().toLowerCase();
  if (fp.includes('test-keys')) { score += 3; reasons.push('fingerprint:test-keys'); }
  if (fp.includes('generic')) { score += 1; reasons.push('fingerprint:generic'); }

  const model = (info.model || '').toString().toLowerCase();
  const manufacturer = (info.manufacturer || '').toString().toLowerCase();
  const emulatorIndicators = ['sdk_gphone', 'emulator', 'simulator', 'generic', 'goldfish', 'ranchu'];
  if (emulatorIndicators.some(ind => model.includes(ind))) { score += 1; reasons.push('model:emulator-indicator'); }
  if (emulatorIndicators.some(ind => manufacturer.includes(ind))) { score += 1; reasons.push('manufacturer:emulator-indicator'); }

  if (__DEV__) { score += 1; reasons.push('build:dev-mode'); }

  // If multiple strong signals combine, boost
  if (reasons.filter(r => r.startsWith('fingerprint:')).length >= 1 && reasons.some(r => r.includes('emulator'))) {
    score += 1; reasons.push('combo:fingerprint+emulator');
  }

  return { score, reasons };
}

export function useRootDetection(opts: Options = {}) {
  const { onBlocked, threshold = 3, showAlert = true } = opts;
  const [result, setResult] = useState<RootHeuristicsResult>({ rooted: null, riskScore: 0, reasons: [], details: {} });
  const isJailbroken = useJailbreakDetection();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (Platform.OS === 'web') {
        if (!cancelled) setResult({ rooted: false, riskScore: 0, reasons: ['platform:web'], details: snapshotInfo(), evaluatedAt: new Date().toISOString() });
        return;
      }
      // iOS: use jailbreak detection
      if (Platform.OS === 'ios') {
        if (isJailbroken) {
          if (!cancelled) setResult({ rooted: true, riskScore: 10, reasons: ['ios:jailbreak-detected'], details: snapshotInfo(), evaluatedAt: new Date().toISOString() });
          if (showAlert) {
            Alert.alert(
              'Security Warning',
              'This device appears to be jailbroken. For security, the app will close.',
              [{ text: 'Exit', onPress: () => { onBlocked?.(); } }],
              { cancelable: false }
            );
          }
          return;
        } else {
          if (!cancelled) setResult({ rooted: false, riskScore: 0, reasons: [], details: snapshotInfo(), evaluatedAt: new Date().toISOString() });
          return;
        }
      }
      // Android: use heuristics
      const info = snapshotInfo();
      const { score, reasons } = evaluateHeuristics(info);
      const rooted = score >= threshold;
      if (cancelled) return;
      setResult({ rooted, riskScore: score, reasons, details: info, evaluatedAt: new Date().toISOString() });
      if (rooted && showAlert) {
        Alert.alert(
          'Security Warning',
          'Potential rooted / compromised environment detected (heuristics). For security the app will close.',
          [{ text: 'Exit', onPress: () => { onBlocked?.(); } }],
          { cancelable: false }
        );
      }
    };
    run();
    // Optional second pass after short delay (some native modules populate late)
    const retry = setTimeout(() => { if (result.rooted === null) run(); }, 1200);
    return () => { cancelled = true; clearTimeout(retry); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJailbroken]);

  return result;
}
