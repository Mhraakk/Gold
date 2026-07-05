import { describe, it, expect } from 'vitest';
import { analyzeMazanehLongTerm } from '../src/lib/analysis/mazanehLongTerm';
import type { AnalysisInput, VerifiedTick } from '../src/lib/analysis/mazanehLongTerm/types';

describe('Mazaneh Weekly & Long-Term Intelligence Engine', () => {
  const createValidTicks = (count: number): VerifiedTick[] => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `tick_${i}`,
      timestamp: 1600000000 + i * 1000,
      priceString: (180000000 + (i * 1000000)).toString(), // Increasing significantly
      assetKey: 'melted_gold',
      isCash: true
    }));
  };

  it('rejects analysis when history is insufficient', () => {
    const input: AnalysisInput = {
      horizon: '1W',
      mazannehTicks: createValidTicks(5),
      driverSeries: {}
    };
    const result = analyzeMazanehLongTerm(input);
    expect(result.isEligible).toBe(false);
    expect(result.ineligibilityReason).toContain('Insufficient verified history');
  });

  it('rejects analysis if any tick is not cash', () => {
    const ticks = createValidTicks(10);
    ticks[5].isCash = false; // introduce non-cash tick
    
    const input: AnalysisInput = {
      horizon: '1W',
      mazannehTicks: ticks,
      driverSeries: {}
    };
    const result = analyzeMazanehLongTerm(input);
    expect(result.isEligible).toBe(false);
    expect(result.ineligibilityReason).toContain('Mixed cash/forward Mazaneh detected');
  });

  it('rejects analysis if there are duplicate timestamps', () => {
    const ticks = createValidTicks(10);
    ticks[1].timestamp = ticks[0].timestamp; // create duplicate
    
    const input: AnalysisInput = {
      horizon: '1W',
      mazannehTicks: ticks,
      driverSeries: {}
    };
    const result = analyzeMazanehLongTerm(input);
    expect(result.isEligible).toBe(false);
    expect(result.ineligibilityReason).toContain('Duplicate ticks detected');
  });

  it('analyzes valid history and computes Fibonacci correctly using BigInt', () => {
    const input: AnalysisInput = {
      horizon: '1W',
      mazannehTicks: createValidTicks(20),
      driverSeries: {}
    };
    const result = analyzeMazanehLongTerm(input);
    
    expect(result.isEligible).toBe(true);
    expect(Object.keys(result.fibonacciLevels).length).toBe(6);
    expect(result.evidence.length).toBeGreaterThan(0);
    // Since it's monotonically increasing
    expect(result.marketStructure).toBe('Bullish');
  });
});
