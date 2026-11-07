import TextRecognition from '@react-native-ml-kit/text-recognition';
import { parseCard, type ParsedCard } from './parseCard';

/** Reads the text lines from a photo on the phone itself (nothing is uploaded). */
export async function readLines(imageUri: string): Promise<string[]> {
  const result = await TextRecognition.recognize(imageUri);
  const blocks = [...result.blocks].sort((a, b) => (a.frame?.top ?? 0) - (b.frame?.top ?? 0));
  return blocks.flatMap((b) => b.lines.map((l) => l.text));
}

/** Reads a photo and extracts contact details. Returns null when almost no text is found. */
export async function readCard(imageUri: string, defaultCountryCode: string): Promise<ParsedCard | null> {
  const lines = await readLines(imageUri);
  if (lines.join('').trim().length < 6) return null;
  return parseCard(lines, { defaultCountryCode });
}
