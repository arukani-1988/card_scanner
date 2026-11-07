// Decides, from the text seen in successive camera frames, when a card is in view and held steady.

const EMAIL = /[A-Z0-9._%+-]+\s*@\s*[A-Z0-9-]+/i;
const PHONE = /(?:\+|00)?\d[\d\s().\-]{6,}\d/;

/** A frame "looks like a card" when it has a few short lines including an email or phone number. */
export function looksLikeCard(lines: string[]): boolean {
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  if (clean.length < 3 || clean.length > 30) return false;
  const text = clean.join('\n');
  if (text.length > 700) return false;
  const digits = (s: string) => s.replace(/\D/g, '').length;
  const hasPhone = clean.some((l) => PHONE.test(l) && digits(l) >= 8 && digits(l) <= 15);
  return EMAIL.test(text) || hasPhone;
}

function tokens(lines: string[]): Set<string> {
  const out = new Set<string>();
  for (const line of lines) {
    for (const t of line.toLowerCase().split(/[^a-z0-9@.]+/)) {
      if (t.length >= 3) out.add(t);
    }
  }
  return out;
}

/** 0 to 1: how much of the words and numbers match between two frames. */
export function similarity(a: string[], b: string[]): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared++;
  });
  return shared / (ta.size + tb.size - shared);
}

/** Feed it the lines of each frame in turn. `push` returns true when the card has been steady. */
export class SteadyTracker {
  private previous: string[] | null = null;
  constructor(private threshold = 0.6) {}

  reset(): void {
    this.previous = null;
  }

  push(lines: string[]): 'none' | 'detected' | 'steady' {
    if (!looksLikeCard(lines)) {
      this.previous = null;
      return 'none';
    }
    const prev = this.previous;
    this.previous = lines;
    if (prev && similarity(prev, lines) >= this.threshold) return 'steady';
    return 'detected';
  }
}
