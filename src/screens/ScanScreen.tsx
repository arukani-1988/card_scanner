import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { readCard } from '../ocr';
import { loadSettings, addCard } from '../storage';
import { saveToContacts } from '../saveContact';
import type { RootStackParamList } from '../types';
import { PrimaryButton } from '../components/Ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

export default function ScanScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [busy, setBusy] = useState(false);

  async function process(uri: string) {
    setBusy(true);
    try {
      const settings = await loadSettings();
      const card = await readCard(uri, settings.countryCode);
      if (!card) {
        Alert.alert('Could not read this card', 'Try again in better light, with the whole card inside the frame.');
        return;
      }
      if (settings.skipReview && (card.name || card.phones.length)) {
        const ok = await saveToContacts(card);
        if (!ok) {
          Alert.alert('Contacts permission needed', 'Allow access to contacts in your phone settings so cards can be saved.');
          return;
        }
        await addCard({ ...card, id: String(Date.now()), savedAt: Date.now() });
        navigation.navigate('Saved', {
          name: card.name,
          title: card.title,
          company: card.company,
          phones: card.phones.length,
          emails: card.emails.length,
          website: card.website ? 1 : 0,
          address: card.address ? 1 : 0,
        });
        return;
      }
      navigation.navigate('Review', { card });
    } catch {
      Alert.alert('Something went wrong', 'The card could not be read. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function capture() {
    if (busy || !cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
    await process(photo.uri);
  }

  async function pickFromGallery() {
    if (busy) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets[0]) await process(result.assets[0].uri);
  }

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
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>Place the card inside the frame</Text>
        <Text style={styles.subHint}>Good light and a flat surface help</Text>
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
