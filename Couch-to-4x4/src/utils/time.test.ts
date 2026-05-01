import { describe, it, expect } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  it('formats seconds correctly', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats minutes correctly', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(600)).toBe('10:00');
  });

  it('handles zero seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('pads single digit seconds with leading zero', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(5)).toBe('0:05');
  });
});
