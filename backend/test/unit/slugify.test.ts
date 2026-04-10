import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/slugify.js';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('strips quotes and collapses punctuation', () => {
    expect(slugify(`O'Connor & Sons!!!`)).toBe('oconnor-sons');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('---party---')).toBe('party');
  });

  it('caps length at 80', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBe(80);
  });
});
