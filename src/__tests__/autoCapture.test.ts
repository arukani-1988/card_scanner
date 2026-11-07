import { SteadyTracker, looksLikeCard, similarity } from '../autoCapture';
import { parseCardLink } from '../links';

const card = ['Priya Mehta', 'Head of Operations', 'Meridian Textiles Pvt. Ltd.', '+91 98765 43210', 'priya@meridiantextiles.in'];

describe('auto-capture helpers', () => {
  it('recognises a card and rejects a page of text', () => {
    expect(looksLikeCard(card)).toBe(true);
    expect(looksLikeCard(['Hello', 'World'])).toBe(false);
    expect(looksLikeCard(Array.from({ length: 40 }, (_, i) => `Line number ${i} of a long document 123456789`))).toBe(false);
  });

  it('measures how alike two frames are', () => {
    expect(similarity(card, [...card])).toBe(1);
    expect(similarity(card, ['Something', 'completely different here'])).toBeLessThan(0.2);
  });

  it('reports steady only after two matching frames', () => {
    const t = new SteadyTracker();
    expect(t.push(['nothing here'])).toBe('none');
    expect(t.push(card)).toBe('detected');
    expect(t.push(card.map((l) => l.replace('Pvt.', 'Pvt')))).toBe('steady');
  });

  it('starts again when the card moves out of view', () => {
    const t = new SteadyTracker();
    t.push(card);
    t.push(['blurry']);
    expect(t.push(card)).toBe('detected');
  });
});

describe('parseCardLink', () => {
  it('reads the notification link', () => {
    expect(parseCardLink('cardscanner://card?action=save&uri=content%3A%2F%2Fmedia%2Fexternal%2Fimages%2Fmedia%2F123')).toEqual({
      uri: 'content://media/external/images/media/123',
      action: 'save',
    });
  });

  it('defaults to review and ignores other links', () => {
    expect(parseCardLink('cardscanner://card?uri=file%3A%2F%2F%2Fa.jpg')?.action).toBe('review');
    expect(parseCardLink('https://example.com')).toBeNull();
    expect(parseCardLink(null)).toBeNull();
    expect(parseCardLink('cardscanner://card?action=save')).toBeNull();
  });
});
