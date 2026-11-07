import { splitAddress } from '../address';

describe('splitAddress', () => {
  it('splits a full Indian address', () => {
    expect(splitAddress('204 Trade Centre, Sarkhej-Gandhinagar Highway, Ahmedabad, Gujarat 380054')).toEqual({
      street: '204 Trade Centre, Sarkhej-Gandhinagar Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postcode: '380054',
      country: '',
    });
  });

  it('handles a state glued to the city and a country at the end', () => {
    const a = splitAddress('Plot 14, GIDC Estate, Vatva, Ahmedabad Gujarat 382445, India');
    expect(a.state).toBe('Gujarat');
    expect(a.city).toBe('Ahmedabad');
    expect(a.country).toBe('India');
    expect(a.postcode).toBe('382445');
    expect(a.street).toBe('Plot 14, GIDC Estate, Vatva');
  });

  it('falls back to the street when the structure is unclear', () => {
    expect(splitAddress('12 Station Road').street).toBe('12 Station Road');
  });
});
