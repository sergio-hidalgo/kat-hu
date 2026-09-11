import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../data/testimonials', () => ({ getTestimonials: vi.fn() }));

import Testimonials from './Testimonials.astro';
import { LANDING_DEFAULTS } from '../../data/landing';
import { getTestimonials } from '../../data/testimonials';

const copy = LANDING_DEFAULTS.testimonials;

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Testimonials, { props: { copy } });
}

afterEach(() => vi.mocked(getTestimonials).mockReset());

describe('Testimonials', () => {
  it('renders its headline and each testimonial with the person and the cat', async () => {
    vi.mocked(getTestimonials).mockResolvedValueOnce([
      { id: 't1', quote: 'Mochi vuelve a dormir tranquilo.', name: 'Ana García', cat: 'Mochi' },
      { id: 't2', quote: 'Nube y Trufa ya comparten sofá.', name: 'Luis Pérez' },
    ]);

    const html = await render();

    expect(html).toContain(copy.headline);
    expect(html.match(/<figure\b/g)).toHaveLength(2);
    expect(html).toContain('Mochi vuelve a dormir tranquilo.');
    expect(html).toContain('Ana García');
    expect(html).toContain('Mochi');
  });

  it('renders nothing at all with zero testimonials — the recorded exception to PAT-07', async () => {
    vi.mocked(getTestimonials).mockResolvedValueOnce([]);

    expect((await render()).trim()).toBe('');
  });
});
