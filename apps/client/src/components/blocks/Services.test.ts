import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from './Services.astro';
import { LANDING_DEFAULTS, SERVICE_IDS } from '../../data/landing';

const copy = LANDING_DEFAULTS.services;

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Services, { props: { copy } });
}

describe('Services', () => {
  it('renders its headline and one card per service, each booking that service', async () => {
    const html = await render();

    expect(html).toContain(copy.headline);
    for (const id of SERVICE_IDS) {
      expect(html).toContain(copy[id].title);
      expect(html).toContain(`href="/reservar?servicio=${id}"`);
    }
  });

  it('shows duration • modality and the price with the euro sign after it (guide §7.4)', async () => {
    const html = await render();

    for (const id of SERVICE_IDS) {
      expect(html).toContain(copy[id].price);
      expect(html).toMatch(new RegExp(`${copy[id].duration}<span class="text-mist"> • </span>${copy[id].modality}`));
    }
  });

  it('keeps every card button outlined — the page’s one filled action is the hero’s (HIE-01)', async () => {
    const html = await render();

    expect(html).not.toContain('bg-violet-700 text-cloud');
    expect(html.match(/border border-violet-700 text-violet-700/g)).toHaveLength(SERVICE_IDS.length);
  });

  it('gives each card a 160px illustration slot that is decoration', async () => {
    const slots = (await render()).match(/<div aria-hidden="true" data-spot="[a-z]+" class="[^"]*size-40/g);

    expect(slots).toHaveLength(SERVICE_IDS.length);
  });
  it('puts its heading on a row of its own, so no card climbs up beside it', async () => {
    const html = await render();
    const heading = html.match(/<div class="([^"]*)">\s*<h2/)?.[1];

    expect(heading).toBe('col-span-12');
  });
});
