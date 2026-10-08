import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../data/testimonials', () => ({
  getTestimonials: vi.fn(async () => [{ id: 't1', quote: 'Muy bien.', name: 'Ana', cat: 'Mochi' }]),
}));

import HowItWorks from './HowItWorks.astro';
import Services from './Services.astro';
import Testimonials from './Testimonials.astro';
import { LANDING_DEFAULTS } from '../../data/landing';

/**
 * The background drawings of a large portrait phone (an iPhone Pro Max,
 * 440×956), placed by the owner on 2026-10-06 with the `phone-xl:` variant.
 * The desktop's own classes stay beside them, untouched.
 */

const flora = (html: string, name: string) =>
  html.match(new RegExp(`<div[^>]*data-flora="${name}"[^>]*>`))?.[0] ?? '';
const copy = LANDING_DEFAULTS;

async function render(component: Parameters<AstroContainer['renderToString']>[0], props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props });
}

describe('phone-xl drawings', () => {
  it('Nuestro proceso: the leaf comes in bottom left, the flowers on the right stay hidden', async () => {
    const html = await render(HowItWorks, { copy: copy['how-it-works'] });

    expect(flora(html, 'line-leaf')).toContain('phone-xl:bottom-[calc(var(--edge-height)+1rem)]');
    expect(flora(html, 'line-leaf')).toContain('lg:block');
    expect(html.match(/<div[^>]*data-flora="line-flower"[^>]*>/g)?.every((f) => !f.includes('phone-xl'))).toBe(true);
  });

  it('Nuestros servicios: the daisy comes in at the top left, as on the desktop', async () => {
    const daisy = flora(await render(Services, { copy: copy.services }), 'line-daisy');

    expect(daisy).toContain('phone-xl:block');
    expect(daisy).toContain('phone-xl:-left-[20vw]');
    expect(daisy).toContain('phone-xl:w-[60vw]');
    expect(daisy).toContain('top-24');
  });

  it('Testimonios: the sprig moves to the bottom right, mirrored, at the same height; the yellow flower stays hidden', async () => {
    const html = await render(Testimonials, { copy: copy.testimonials });
    const sprig = flora(html, 'line-sprig');

    expect(sprig).toContain('bottom-16');
    expect(sprig).toContain('phone-xl:-right-[16vw]');
    expect(sprig).toContain('phone-xl:rotate-3');
    expect(sprig).toContain('phone-xl:scale-x-100');
    expect(html.match(/<img[^>]*data-flora="pressed-yellow"[^>]*>/)?.[0]).not.toContain('phone-xl');
  });
});

describe('phone-md drawings (an iPhone 16 at 393px, owner 2026-10-06)', () => {
  it('give the regular portrait phones the same drawings in the same shares of the screen, and leave the edges alone', async () => {
    const how = await render(HowItWorks, { copy: copy['how-it-works'] });
    const services = await render(Services, { copy: copy.services });
    const testimonials = await render(Testimonials, { copy: copy.testimonials });

    expect(flora(how, 'line-leaf')).toContain('phone-md:bottom-[calc(var(--edge-height)+1rem)]');
    expect(flora(services, 'line-daisy')).toContain('phone-md:w-[60vw]');
    expect(flora(testimonials, 'line-sprig')).toContain('phone-md:-right-[16vw]');
    expect(flora(testimonials, 'line-sprig')).toContain('phone-md:scale-x-100');
    // The separators are made taller by `theme.css`, not by a class here.
    expect(how + services + testimonials).not.toMatch(/phone-md:(h-|\[--edge)/);
  });
});

describe('tablet drawings (an iPad mini at 768px, owner 2026-10-07)', () => {
  it('give a portrait tablet the same drawings, and take the md-only rules out of its way', async () => {
    const how = await render(HowItWorks, { copy: copy['how-it-works'] });
    const services = await render(Services, { copy: copy.services });
    const testimonials = await render(Testimonials, { copy: copy.testimonials });

    expect(flora(how, 'line-leaf')).toContain('tablet:bottom-[calc(var(--edge-height)+1rem)]');
    expect(flora(how, 'line-leaf')).toContain('tablet:block');
    expect(flora(services, 'line-daisy')).toContain('tablet:block');
    expect(flora(testimonials, 'line-sprig')).toContain('tablet:-right-[10vw]');
    expect(flora(testimonials, 'line-sprig')).toContain('tablet:scale-x-100');
    expect(how.match(/<div[^>]*data-flora="line-flower"[^>]*>/g)?.every((f) => !f.includes('tablet'))).toBe(true);
  });
});
