import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../data/testimonials', () => ({ getTestimonials: vi.fn() }));

import Testimonials from './Testimonials.astro';
import { LANDING_DEFAULTS } from '../../data/landing';
import { getTestimonials } from '../../data/testimonials';
import { testimonialPlace } from './testimonials';

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
    expect(html).toContain(copy.lead);
    expect(html.match(/<figure\b/g)).toHaveLength(2);
    expect(html).toContain('Mochi vuelve a dormir tranquilo.');
    expect(html).toContain('Ana García');
    expect(html).toContain('Mochi');
  });

  it('is a carousel below lg from two quotes up, with autoplay, and none for a single quote (spec 05e)', async () => {
    const quote = (n: number) => ({ id: `t${n}`, quote: `Cita ${n}`, name: `Persona ${n}` });
    vi.mocked(getTestimonials).mockResolvedValueOnce([quote(1), quote(2)]);
    const two = await render();

    expect(two).toContain('data-carousel');
    expect(two).toContain('data-autoplay');
    expect(two).toContain('max-lg:overflow-x-auto');
    // From lg: the row it was, on the page grid's own columns.
    expect(two).toContain('lg:grid-cols-12');
    expect(two).toContain('lg:col-span-4 lg:col-start-3');

    vi.mocked(getTestimonials).mockResolvedValueOnce([quote(1)]);
    const one = await render();

    expect(one).not.toContain('data-carousel');
    expect(one).toContain('Cita 1');
  });

  it('keeps the scroll track on a desktop too past three quotes', async () => {
    vi.mocked(getTestimonials).mockResolvedValueOnce(
      [1, 2, 3, 4].map((n) => ({ id: `t${n}`, quote: `Cita ${n}`, name: `P${n}` })),
    );

    const html = await render();

    expect(html).toContain('lg:auto-cols-[calc(100%*7/23)]');
    expect(html).not.toContain('max-lg:overflow-x-auto');
    expect(html).not.toContain('lg:hidden');
  });

  it('renders nothing at all with zero testimonials — the recorded exception to PAT-07', async () => {
    vi.mocked(getTestimonials).mockResolvedValueOnce([]);

    expect((await render()).trim()).toBe('');
  });
});

describe('testimonialPlace', () => {
  it('centres one card, pairs two about the centre line, and fills a row with three', () => {
    expect(testimonialPlace(1, 0)).toBe('col-span-12 md:col-span-6 lg:col-span-4 md:col-start-4 lg:col-start-5');
    expect([0, 1].map((i) => testimonialPlace(2, i))).toEqual([
      'lg:col-span-4 lg:col-start-3',
      'lg:col-span-4 lg:col-start-7',
    ]);
    expect(testimonialPlace(3, 2)).toBe('lg:col-span-4');
  });
});
