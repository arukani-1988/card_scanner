import { PermissionsAndroid, Platform } from 'react-native';

/** Asks for photo access and (Android 13+) notification permission. Returns true only if both are granted. */
export async function requestPhotoDetectionPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const wanted =
    Platform.Version >= 33
      ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS]
      : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];
  const result = await PermissionsAndroid.requestMultiple(wanted);
  return wanted.every((p) => result[p] === PermissionsAndroid.RESULTS.GRANTED);
}
