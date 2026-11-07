import type { ParsedCard } from './parseCard';

export type RootStackParamList = {
  Scan: undefined;
  Review: { card: ParsedCard };
  Saved: { name: string; title: string; company: string; phones: number; emails: number; website: number; address: number };
  Cards: undefined;
  Settings: undefined;
};
