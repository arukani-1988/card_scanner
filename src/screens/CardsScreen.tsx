import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { PrimaryButton } from '../components/Ui';
import { loadCards, type SavedCard } from '../storage';
import { initials } from './SavedScreen';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cards'>;

function when(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const days = (now.getTime() - ts) / 86400000;
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function CardsScreen({ navigation }: Props) {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadCards().then(setCards);
    }, []),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => navigation.navigate('Settings')} style={styles.gear}>
          <Ionicons name="settings-outline" size={22} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => [c.name, c.company, c.title].some((v) => v.toLowerCase().includes(q)));
  }, [cards, query]);

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.top}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Saved cards</Text>
          <Text style={styles.count}>{cards.length} {cards.length === 1 ? 'card' : 'cards'}</Text>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            accessibilityLabel="Search cards"
            placeholder="Search name or company"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>{cards.length ? 'No cards match your search.' : 'No cards yet. Scan your first card to see it here.'}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(item.name)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name || item.emails[0] || item.phones[0]?.number || 'Unnamed'}</Text>
              <Text style={styles.company} numberOfLines={1}>{item.company || item.title}</Text>
            </View>
            <Text style={styles.time}>{when(item.savedAt)}</Text>
          </View>
        )}
      />

      <View style={styles.fab}>
        <PrimaryButton label="Scan card" onPress={() => navigation.popTo('Scan')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 24, paddingTop: 4, gap: 16, paddingBottom: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontSize: 28, fontWeight: '700', color: colors.ink },
  count: { fontSize: 14, color: colors.muted },
  searchWrap: { justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  search: { height: 48, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, backgroundColor: colors.surface, paddingLeft: 40, paddingRight: 14, fontSize: 16, color: colors.ink },
  gear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink },
  company: { fontSize: 14, color: colors.muted },
  time: { fontSize: 13, color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 15, marginTop: 48, lineHeight: 22 },
  fab: { position: 'absolute', left: 24, right: 24, bottom: 16 },
});
