import { describe, expect, it } from 'vitest';
import type { PortableTextNode } from '../lib/sanity';
import { deriveExcerpt, formatDate } from './posts';

/** A Portable Text paragraph, trimmed to the fields `deriveExcerpt` reads. */
const block = (text: string): PortableTextNode => ({
  _type: 'block',
  children: [{ _type: 'span', text }],
});

describe('deriveExcerpt', () => {
  it('returns short text unchanged, with no ellipsis', () => {
    const text = 'Mochi duerme al sol.';

    expect(deriveExcerpt([block(text)])).toBe(text);
    expect(deriveExcerpt([block(text)])).not.toContain('…');
  });

  it('joins the spans of several blocks', () => {
    expect(deriveExcerpt([block('Uno. '), block('Dos.')])).toBe('Uno. Dos.');
  });

  it('cuts at a word boundary and appends an ellipsis when over the limit', () => {
    const excerpt = deriveExcerpt([block('uno dos tres cuatro cinco')], 10);

    // A hard cut at 10 would split "tres"; it backs up to the space at 7.
    expect(excerpt).toBe('uno dos…');
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt).not.toContain('tre');
  });

  it('leaves no space before the ellipsis', () => {
    expect(deriveExcerpt([block('uno dos tres')], 4)).toBe('uno…');
  });

  it('ignores non-block nodes such as images', () => {
    const body: PortableTextNode[] = [
      { _type: 'image', asset: { _ref: 'image-abc', _type: 'reference' } },
      block('Solo el texto.'),
    ];

    expect(deriveExcerpt(body)).toBe('Solo el texto.');
  });

  it('returns an empty string for an empty or missing body', () => {
    expect(deriveExcerpt([])).toBe('');
    expect(deriveExcerpt()).toBe('');
  });
});

describe('formatDate', () => {
  it('formats an ISO date in Spanish', () => {
    expect(formatDate('2026-09-07', 'es-ES')).toBe('7 de septiembre de 2026');
  });

  it('reads the date in UTC, so the day never shifts with the timezone', () => {
    // Late UTC on the 7th is already the 8th in some zones; it must stay the 7th.
    expect(formatDate('2026-09-07T23:30:00Z', 'es-ES')).toBe(
      '7 de septiembre de 2026',
    );
  });
});
