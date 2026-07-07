import { AMENITY_PRESETS, hasAmenity, parseAmenities, toggleAmenity } from '../amenities-field';

describe('amenities-field', () => {
  it('parses a comma string into trimmed non-empty tokens', () => {
    expect(parseAmenities('Parking,  Wi-Fi , ,Gym')).toEqual(['Parking', 'Wi-Fi', 'Gym']);
    expect(parseAmenities('')).toEqual([]);
  });

  it('tests membership case-insensitively', () => {
    expect(hasAmenity('Parking, Wi-Fi', 'wi-fi')).toBe(true);
    expect(hasAmenity('Parking, Wi-Fi', 'Gym')).toBe(false);
  });

  it('adds an absent amenity to the end', () => {
    expect(toggleAmenity('Parking', 'Wi-Fi')).toBe('Parking, Wi-Fi');
    expect(toggleAmenity('', 'Gym')).toBe('Gym');
  });

  it('removes a present amenity (case-insensitively) and keeps the rest', () => {
    expect(toggleAmenity('Parking, Wi-Fi, Gym', 'wi-fi')).toBe('Parking, Gym');
    expect(toggleAmenity('Gym', 'Gym')).toBe('');
  });

  it('preserves custom non-preset tokens the user typed', () => {
    const custom = 'Water backup, caretaker';
    const added = toggleAmenity(custom, 'Parking');
    expect(added).toBe('Water backup, caretaker, Parking');
    expect(toggleAmenity(added, 'Parking')).toBe(custom);
  });

  it('ships the six design presets', () => {
    expect(AMENITY_PRESETS).toHaveLength(6);
    expect(AMENITY_PRESETS).toContain('Wi-Fi');
  });
});
