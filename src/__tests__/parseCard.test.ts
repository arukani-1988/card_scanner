import { parseCard, splitName } from '../parseCard';

describe('parseCard', () => {
  it('reads a typical Indian business card', () => {
    const card = parseCard([
      'MERIDIAN TEXTILES PVT. LTD.',
      'Priya Mehta',
      'Head of Operations',
      'Mobile: +91 98765 43210',
      'Tel: +91 79 2640 1122',
      'Fax: +91 79 2640 1123',
      'priya@meridiantextiles.in',
      'www.meridiantextiles.in',
      '204 Trade Centre, Sarkhej-Gandhinagar Highway',
      'Ahmedabad, Gujarat 380054',
    ]);
    expect(card.name).toBe('Priya Mehta');
    expect(card.title).toBe('Head of Operations');
    expect(card.company).toBe('MERIDIAN TEXTILES PVT. LTD.');
    expect(card.emails).toEqual(['priya@meridiantextiles.in']);
    expect(card.website).toBe('www.meridiantextiles.in');
    expect(card.phones).toEqual([
      { kind: 'mobile', number: '+91 98765 43210' },
      { kind: 'work', number: '+91 79 2640 1122' },
      { kind: 'fax', number: '+91 79 2640 1123' },
    ]);
    expect(card.address).toBe('204 Trade Centre, Sarkhej-Gandhinagar Highway, Ahmedabad, Gujarat 380054');
  });

  it('splits several numbers on one line and formats bare mobiles', () => {
    const card = parseCard(['Rahul Shah', 'Partner', 'Shah & Co. Chartered Accountants', 'M: 98250 12345 / 98250 67890']);
    expect(card.phones).toEqual([
      { kind: 'mobile', number: '+91 98250 12345' },
      { kind: 'mobile', number: '+91 98250 67890' },
    ]);
    expect(card.company).toBe('Shah & Co. Chartered Accountants');
    expect(card.name).toBe('Rahul Shah');
  });

  it('does not treat a pin code as a phone number', () => {
    const card = parseCard(['Anita Desai', 'Plot 14, GIDC Estate, Vatva', 'Ahmedabad 382445', '079-2583 4410']);
    expect(card.phones).toHaveLength(1);
    expect(card.phones[0].kind).toBe('work');
    expect(card.address).toContain('382445');
  });

  it('keeps international numbers and removes duplicates', () => {
    const card = parseCard(['Karan Patel', 'Director', 'Patel Engineering Works', 'T +44 20 7946 0958', 'Office +44 20 7946 0958']);
    expect(card.phones).toEqual([{ kind: 'work', number: '+44 20 7946 0958' }]);
  });

  it('falls back to the email for the name when none is readable', () => {
    const card = parseCard(['neha.joshi@joshiinteriors.com', '+91 91234 56780']);
    expect(card.name).toBe('Neha Joshi');
    expect(card.phones[0].number).toBe('+91 91234 56780');
  });

  it('does not take an email domain for a website', () => {
    const card = parseCard(['A Person', 'a.person@example.com']);
    expect(card.website).toBe('');
  });
});

describe('splitName', () => {
  it('splits given and family names', () => {
    expect(splitName('Priya Mehta')).toEqual({ givenName: 'Priya', familyName: 'Mehta' });
    expect(splitName('Priya R. Mehta')).toEqual({ givenName: 'Priya R.', familyName: 'Mehta' });
    expect(splitName('Madonna')).toEqual({ givenName: 'Madonna', familyName: '' });
  });
});
