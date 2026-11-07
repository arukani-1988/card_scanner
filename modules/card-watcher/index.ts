import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

interface CardWatcherNative {
  setPhotoDetection(enabled: boolean): boolean;
  isPhotoDetectionEnabled(): boolean;
  getInitialSharedImage(): string | null;
  addListener(event: 'onSharedImage', listener: (e: { uri: string }) => void): { remove(): void };
}

function load(): CardWatcherNative | null {
  if (Platform.OS !== 'android') return null;
  try {
    return requireNativeModule<CardWatcherNative>('CardWatcher');
  } catch {
    return null; // for example when running in a build made before the module was added
  }
}

/** Android-only features: new-photo detection and the Share menu. Null on iPhone. */
export const CardWatcher = load();
