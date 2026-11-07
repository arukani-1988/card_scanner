import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '../storage';
import { CardWatcher } from '../../modules/card-watcher';
import { requestPhotoDetectionPermissions } from '../photoPermissions';

function SwitchRow({
  title,
  body,
  value,
  onChange,
  last,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.switchOff, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  async function togglePhotoDetection(enabled: boolean) {
    if (!CardWatcher) {
      Alert.alert('Not available', 'This feature needs the latest version of the app.');
      return;
    }
    if (enabled) {
      const ok = await requestPhotoDetectionPermissions();
      if (!ok) {
        Alert.alert(
          'Permission needed',
          'Allow access to all photos and notifications so Card Scanner can tell you when a photo looks like a business card. You can change this in your phone settings.',
        );
        return;
      }
    }
    CardWatcher.setPhotoDetection(enabled);
    update({ photoDetection: enabled });
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.group}>
          <SwitchRow
            title="Auto-capture"
            body="Takes the photo by itself when a card is held steady in the frame."
            value={settings.autoCapture}
            onChange={(v) => update({ autoCapture: v })}
          />
          {Platform.OS === 'android' && (
            <SwitchRow
              title="Detect cards in new photos"
              body="When a photo from your camera looks like a business card, you get a notification with a Save contact button."
              value={settings.photoDetection}
              onChange={togglePhotoDetection}
            />
          )}
          <SwitchRow
            title="Skip review, save directly"
            body="Off by default, so you can check details before they are saved."
            value={settings.skipReview}
            onChange={(v) => update({ skipReview: v })}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.rowTitle}>Default country code</Text>
              <Text style={styles.rowBody}>Added to 10-digit mobile numbers that have no country code.</Text>
            </View>
            <View style={styles.codeWrap}>
              <Text style={styles.plus}>+</Text>
              <TextInput
                accessibilityLabel="Default country code"
                value={settings.countryCode}
                keyboardType="number-pad"
                maxLength={3}
                onChangeText={(t) => update({ countryCode: t.replace(/\D/g, '') })}
                style={styles.code}
              />
            </View>
          </View>
        </View>

        {Platform.OS === 'android' && (
          <Text style={styles.note}>
            You can also open any photo in your gallery, tap Share, and choose Card Scanner.
          </Text>
        )}
        <Text style={styles.note}>Card photos are read on your phone and are not uploaded anywhere.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 4 },
  group: { marginTop: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rowBody: { fontSize: 13, lineHeight: 18, color: colors.muted },
  codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  plus: { fontSize: 16, color: colors.muted },
  code: { width: 56, height: 44, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.input, textAlign: 'center', fontSize: 16, color: colors.ink, backgroundColor: colors.surface },
  note: { marginTop: 16, marginHorizontal: 4, fontSize: 13, lineHeight: 19, color: colors.muted },
});
