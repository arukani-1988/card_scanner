import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../theme';
import { PrimaryButton, SecondaryButton } from '../components/Ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Saved'>;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function SavedScreen({ navigation, route }: Props) {
  const { name, title, company, phones, emails, website, address } = route.params;
  const subtitle = [title, company].filter(Boolean).join(', ');
  const rows: [string, number][] = [
    ['Phone numbers', phones],
    ['Email', emails],
    ['Website', website],
    ['Address', address],
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <View style={styles.tick}>
          <Ionicons name="checkmark" size={38} color="#FFFFFF" />
        </View>
        <Text style={styles.heading}>Saved to Contacts</Text>
        <Text style={styles.sub}>{name ? `${name} is now in your phone.` : 'The contact is now in your phone.'}</Text>

        <View style={styles.card}>
          <View style={styles.person}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.personName}>{name || 'No name'}</Text>
              {!!subtitle && <Text style={styles.personSub}>{subtitle}</Text>}
            </View>
          </View>
          <View style={styles.divider} />
          {rows.map(([label, count]) => (
            <View key={label} style={styles.statRow}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttons}>
        <PrimaryButton label="Scan another card" onPress={() => navigation.popToTop()} />
        <SecondaryButton label="View saved cards" onPress={() => navigation.navigate('Cards')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tick: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, textAlign: 'center' },
  card: { alignSelf: 'stretch', marginTop: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 20, gap: 10 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  personName: { fontSize: 17, fontWeight: '600', color: colors.ink },
  personSub: { fontSize: 14, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 15, color: colors.muted },
  statValue: { fontSize: 15, fontWeight: '500', color: colors.ink },
  buttons: { gap: 12, paddingBottom: 12 },
});
