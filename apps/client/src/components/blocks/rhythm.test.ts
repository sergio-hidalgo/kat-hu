import { BLOCKS } from '@kat-hu/contracts';
import { describe, expect, it } from 'vitest';
import { BLOCK_TONE, CREAM, LAVENDER, RHYTHM } from './rhythm';

/**
 * The rhythm is CSS the browser evaluates, so this suite holds the selectors
 * to the tone table and to their meaning; the rendered result is checked in a
 * browser (spec 05c's walkthrough probes).
 */
const rules = RHYTHM.split(' ');

const blocksIn = (group: string) => [...group.matchAll(/data-block=([a-z-]+)/g)].map(([, id]) => id);

describe('BLOCK_TONE', () => {
  it('gives every block but the hero a tone', () => {
    expect(Object.keys(BLOCK_TONE).sort()).toEqual(
      BLOCKS.map((block) => block.id).filter((id) => id !== 'hero').sort(),
    );
  });

  it('puts the florapeuta and the process on Lavanda, everything after on Crema (owner, 2026-09-28)', () => {
    expect(blocksIn(LAVENDER).sort()).toEqual(
      Object.entries(BLOCK_TONE).filter(([, tone]) => tone === 'lavender').map(([id]) => id).sort(),
    );
    expect(blocksIn(CREAM).sort()).toEqual(
      Object.entries(BLOCK_TONE).filter(([, tone]) => tone === 'cream').map(([id]) => id).sort(),
    );
    expect(BLOCK_TONE['about-teaser']).toBe('lavender');
    expect(BLOCK_TONE['how-it-works']).toBe('lavender');
    expect(BLOCK_TONE.services).toBe('cream');
    expect(BLOCK_TONE.testimonials).toBe('cream');
  });

  it('keeps each group together in the registry, so one change of colour is all there is', () => {
    const tones = BLOCKS.filter((block) => block.id !== 'hero').map(
      (block) => BLOCK_TONE[block.id as keyof typeof BLOCK_TONE],
    );
    const changes = tones.filter((tone, index) => index > 0 && tone !== tones[index - 1]);

    expect(changes).toHaveLength(1);
  });
});

describe('RHYTHM', () => {
  it('paints each group in its tone', () => {
    expect(rules).toContain(`[&>${LAVENDER}]:bg-lavender`);
    expect(rules).toContain(`[&>${CREAM}]:bg-cream`);
  });

  it('colours an edge in its own band’s tone — it is drawn over the band above', () => {
    expect(rules).toContain(`[&>${LAVENDER}_[data-edge]]:text-lavender`);
    expect(rules).toContain(`[&>${CREAM}_[data-edge]]:text-cream`);
  });

  it('shows an edge only after the hero and where the colour changes', () => {
    expect(rules).toContain('[&>section_[data-edge]]:hidden');
    expect(rules).toContain('[&>[data-block=hero]+section_[data-edge]]:block');
    expect(rules).toContain(`[&>${LAVENDER}+${CREAM}_[data-edge]]:block`);
    expect(rules).toContain(`[&>${CREAM}+${LAVENDER}_[data-edge]]:block`);
    // No rule shows an edge between two bands of one colour.
    const edgeRules = rules.filter((r) => r.endsWith('_[data-edge]]:block'));
    expect(edgeRules.some((r) => r.includes(`${LAVENDER}+${LAVENDER}`) || r.includes(`${CREAM}+${CREAM}`))).toBe(false);
  });

  it('brings two bands of one colour to 5/8 of the distance, on both sides of the join (owner, 2026-09-28)', () => {
    const half = 'calc(clamp(4rem,7vw,7.5rem)*5/8)';

    for (const group of [LAVENDER, CREAM]) {
      expect(rules).toContain(`[&>${group}:has(+${group})]:pb-[${half}]`);
      expect(rules).toContain(`[&>${group}+${group}]:pt-[${half}]`);
    }
    // Only where the colour stays the same: no half rule crosses groups.
    const halves = rules.filter((r) => r.endsWith(`[${half}]`));
    expect(halves).toHaveLength(4);
    expect(halves.some((r) => r.includes(`${LAVENDER}+${CREAM}`) || r.includes(`${CREAM}+${LAVENDER}`))).toBe(false);
  });

  it('keeps room for an edge only before a change of colour and before the footer', () => {
    const room = 'pb-[calc(clamp(4rem,7vw,7.5rem)+var(--edge-height))]';

    expect(rules).toContain(`[&>${LAVENDER}:has(+${CREAM})]:${room}`);
    expect(rules).toContain(`[&>${CREAM}:has(+${LAVENDER})]:${room}`);
    expect(rules).toContain(`[&>section:last-child:not([data-block=hero])]:${room}`);
    expect(rules.filter((r) => r.endsWith(room))).toHaveLength(3);
  });

  it('leaves the height of the edges to `--edge-height`, which `theme.css` raises on portrait phones and tablets', () => {
    expect(rules.some((rule) => rule.includes('data-edge]]:') && /:h-/.test(rule))).toBe(false);
  });
});
