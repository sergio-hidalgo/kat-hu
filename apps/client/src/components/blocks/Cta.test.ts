import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Cta from './Cta.astro';
import { LANDING_DEFAULTS } from '../../data/landing';

const copy = LANDING_DEFAULTS.cta;

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Cta, { props: { copy } });
}

describe('Cta', () => {
  it('renders its closing sentence and the way to book', async () => {
    const html = await render();

    expect(html).toContain(copy.headline);
    expect(html).toMatch(/<a[^>]*href="\/reservar"[^>]*>\s*Reserva tu sesión\s*<\/a>/);
  });

  it('is centred, and its button outlined — the one filled action is the hero’s (HIE-01)', async () => {
    const html = await render();

    expect(html).toContain('text-center');
    expect(html).not.toContain('bg-violet-700 text-cloud');
    expect(html).toContain('border border-violet-700 text-violet-700');
  });
});
