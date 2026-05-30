// ArcGov — arcgov.vercel.app
import { describe, it, expect } from 'vitest';
import { isPlaceholderAddress } from './validators';

describe('isPlaceholderAddress', () => {
  it('treats missing addresses as placeholders', () => {
    expect(isPlaceholderAddress(undefined)).toBe(true);
    expect(isPlaceholderAddress('')).toBe(true);
  });

  it('treats 0x1000... sample addresses as placeholders', () => {
    expect(isPlaceholderAddress('0x1000000000000000000000000000000000000001')).toBe(true);
  });

  it('treats a real-looking address as live', () => {
    expect(isPlaceholderAddress('0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99')).toBe(false);
  });
});
