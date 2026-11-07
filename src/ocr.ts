import TextRecognition from '@react-native-ml-kit/text-recognition';
import { parseCard, type ParsedCard } from './parseCard';

/** Reads text from a photo on the phone itself (nothing is uploaded) and extracts contact details. */
export async function readCard(imageUri: string, defaultCountryCode: string): Promise<ParsedCard | null> {
  const result = await TextRecognition.recognize(imageUri);
  const blocks = [...result.blocks].sort((a, b) => (a.frame?.top ?? 0) - (b.frame?.top ?? 0));
  const lines = blocks.flatMap((b) => b.lines.map((l) => l.text));
  if (lines.join('').trim().length < 6) return null;
  return parseCard(lines, { defaultCountryCode });
}
