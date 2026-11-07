import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParsedPhone } from './parseCard';

export interface SavedCard {
  id: string;
  name: string;
  title: string;
  company: string;
  phones: ParsedPhone[];
  emails: string[];
  website: string;
  address: string;
  savedAt: number;
}

export interface Settings {
  skipReview: boolean;
  countryCode: string; // digits only, e.g. "91"
  autoCapture: boolean; // take the photo by itself when a card is steady in the frame
  photoDetection: boolean; // Android: notify when a new camera photo looks like a card
}

export const DEFAULT_SETTINGS: Settings = { skipReview: false, countryCode: '91', autoCapture: true, photoDetection: false };

const CARDS_KEY = 'cards.v1';
const SETTINGS_KEY = 'settings.v1';

export async function loadCards(): Promise<SavedCard[]> {
  try {
    const raw = await AsyncStorage.getItem(CARDS_KEY);
    return raw ? (JSON.parse(raw) as SavedCard[]) : [];
  } catch {
    return [];
  }
}

export async function addCard(card: SavedCard): Promise<void> {
  const cards = await loadCards();
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify([card, ...cards]));
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
