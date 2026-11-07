import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { readCard, readLines } from '../ocr';
import { SteadyTracker } from '../autoCapture';
import { loadSettings } from '../storage';
import { saveCard } from '../saveContact';
import { savedParams } from '../incoming';
import type { RootStackParamList } from '../types';
import { PrimaryButton } from '../components/Ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

const AUTO_CHECK_MS = 1200;

export default function ScanScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [busy, setBusy] = useState(false);
  const [autoOn, setAutoOn] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cardInView, setCardInView] = useState(false);
  const focused = useIsFocused();

  const busyRef = useRef(false);
  const checkingRef = useRef(false);
  const tracker = useRef(new SteadyTracker()).current;

  useFocusEffect(
    useCallback(() => {
      loadSettings().then((s) => setAutoOn(s.autoCapture));
      tracker.reset();
      setCardInView(false);
    }, [tracker]),
  );

  function setBusyState(value: boolean) {
    busyRef.current = value;
    setBusy(value);
  }

  async function process(uri: string) {
    setBusyState(true);
    try {
      const settings = await loadSettings();
      const card = await readCard(uri, settings.countryCode);
      if (!card) {
        Alert.alert('Could not read this card', 'Try again in better light, with the whole card inside the frame.');
        return;
      }
      if (settings.skipReview && (card.name || card.phones.length)) {
        const outcome = await saveCard(card);
        if (outcome === 'denied') {
          Alert.alert('Contacts permission needed', 'Allow access to contacts in your phone settings so cards can be saved.');
        } else if (outcome !== 'cancelled') {
          navigation.navigate('Saved', savedParams(card));
        }
        return;
      }
      navigation.navigate('Review', { card });
    } catch {
      Alert.alert('Something went wrong', 'The card could not be read. Please try again.');
    } finally {
      setBusyState(false);
    }
  }

  async function capture() {
    if (busyRef.current || !cameraRef.current) return;
    setBusyState(true); // block the auto-capture loop while the photo is taken
    let uri: string | null = null;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      uri = photo.uri;
    } catch {
      Alert.alert('Could not take the photo', 'Please try again.');
    } finally {
      setBusyState(false);
    }
    if (uri) await process(uri);
  }

  async function pickFromGallery() {
    if (busyRef.current) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets[0]) await process(result.assets[0].uri);
  }

  // Auto-capture: look at the live camera about once a second and take the photo when a card has stayed steady.
  useEffect(() => {
    if (!autoOn || !focused || !permission?.granted || !cameraReady) return;
    let cancelled = false;

    const check = async () => {
      if (cancelled || busyRef.current || checkingRef.current || !cameraRef.current) return;
      checkingRef.current = true;
      try {
        const frame = await cameraRef.current.takePictureAsync({ quality: 0.3, skipProcessing: true, shutterSound: false });
        const lines = await readLines(frame.uri);
        if (cancelled || busyRef.current) return;
        const verdict = tracker.push(lines);
        setCardInView(verdict !== 'none');
        if (verdict === 'steady') {
          tracker.reset();
          await capture();
        }
      } catch {
        // a missed frame is fine; the next check tries again
      } finally {
        checkingRef.current = false;
      }
    };

    const timer = setInterval(check, AUTO_CHECK_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOn, focused, permission?.granted, cameraReady]);

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permBody}>Card Scanner uses the camera to photograph business cards. Photos are read on your phone and are not uploaded.</Text>
        <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
          <PrimaryButton label="Allow camera" onPress={requestPermission} />
          <Pressable onPress={pickFromGallery} style={styles.altLink} accessibilityRole="button">
            <Text style={styles.altLinkText}>Choose a photo instead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const headline = autoOn && cardInView ? 'Card detected' : autoOn ? 'Looking for a card…' : 'Place the card inside the frame';
  const subline = autoOn && cardInView ? 'Hold steady, capturing automatically' : 'Good light and a flat surface help';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan card</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Cards')} style={styles.headerLink}>
          <Text style={styles.headerLinkText}>Saved cards</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.viewfinderArea}>
        <View style={styles.viewfinder}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} onCameraReady={() => setCameraReady(true)} />
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>{headline}</Text>
        <Text style={styles.subHint}>{subline}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.side}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose from gallery" onPress={pickFromGallery} style={styles.roundButton}>
            <Ionicons name="images-outline" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.sideLabel}>Gallery</Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Capture card" onPress={capture} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </Pressable>

        <View style={styles.side}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={flash === 'on' ? 'Turn flash off' : 'Turn flash on'}
            onPress={() => setFlash(flash === 'on' ? 'off' : 'on')}
            style={styles.roundButton}
          >
            <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.sideLabel}>Flash</Text>
        </View>
      </View>

      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.busyText}>Reading card…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const CORNER = 36;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.camera },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  permTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '600', marginBottom: 8 },
  permBody: { color: colors.cameraText, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  altLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  altLinkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 16, paddingTop: 8 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
  headerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 8 },
  headerLinkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  viewfinderArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewfinder: { width: '88%', aspectRatio: 1.75, borderRadius: 6, overflow: 'hidden', backgroundColor: '#000000', marginBottom: 22 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFFFFF' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  hint: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  subHint: { color: colors.cameraText, fontSize: 14 },
  controls: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 44, paddingBottom: 28 },
  side: { alignItems: 'center', gap: 8, width: 64 },
  roundButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cameraButton, alignItems: 'center', justifyContent: 'center' },
  sideLabel: { color: colors.cameraText, fontSize: 13 },
  shutterOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
  busy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,17,21,0.78)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  busyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});
