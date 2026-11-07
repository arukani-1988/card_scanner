jest.mock('expo-contacts/legacy', () => ({ Fields: {}, getContactsAsync: jest.fn() }));
import { findDuplicate, phoneKey } from '../duplicates';

const existing = [
  { id: '1', name: 'Priya Mehta', phones: ['098765 43210'], emails: [] },
  { id: '2', name: 'Rahul Shah', phones: ['+91 79 2640 1122'], emails: ['Rahul@Shah.co.in'] },
];

describe('duplicate check', () => {
  it('matches phone numbers written differently', () => {
    expect(phoneKey('+91 98765 43210')).toBe(phoneKey('098765-43210'));
    expect(findDuplicate(existing, { phones: [{ number: '+91 98765 43210' }], emails: [] })?.id).toBe('1');
  });

  it('matches emails ignoring case', () => {
    expect(findDuplicate(existing, { phones: [], emails: ['rahul@shah.co.in'] })?.id).toBe('2');
  });

  it('returns null for a new person or an empty card', () => {
    expect(findDuplicate(existing, { phones: [{ number: '+91 91234 56780' }], emails: ['x@y.com'] })).toBeNull();
    expect(findDuplicate(existing, { phones: [], emails: [] })).toBeNull();
  });

  it('ignores very short numbers', () => {
    expect(phoneKey('123')).toBe('');
  });
});
