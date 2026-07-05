import { describe, it, expect } from 'vitest';
import { forecastGold18, VerifiedQuote } from '../src/gold18Forecast';

describe('gold18Forecast', () => {
  const mockCurrent: VerifiedQuote = {
    price: 45000000,
    timestamp: 1690000000,
    sourceId: 'src_1'
  };

  const mockHistory: VerifiedQuote[] = [
    { price: 44500000, timestamp: 1680000000, sourceId: 'src_1' },
    { price: 44800000, timestamp: 1685000000, sourceId: 'src_1' },
    { price: 45000000, timestamp: 1690000000, sourceId: 'src_1' }
  ];

  it('should generate deterministic forecast for 1H', () => {
    const result = forecastGold18(mockCurrent, mockHistory, '1H');
    expect(result.horizon).toBe('1H');
    expect(result.centralEstimate).toBeGreaterThan(0);
    expect(result.range.low).toBeLessThan(result.centralEstimate);
    expect(result.range.high).toBeGreaterThan(result.centralEstimate);
    expect(result.sourceSnapshotId).toBe('snap_1690000000_3');
  });

  it('should throw error on invalid price', () => {
    expect(() => {
      forecastGold18({ ...mockCurrent, price: -1 }, mockHistory, '1H');
    }).toThrow('Invalid current quote price');
  });

  it('should throw error on empty history', () => {
    expect(() => {
      forecastGold18(mockCurrent, [], '1H');
    }).toThrow('History is required for forecast');
  });
});
