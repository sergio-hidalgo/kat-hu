import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ShopTeaser from './ShopTeaser.astro';

describe('ShopTeaser', () => {
  it('renders nothing until spec 11 gives it products, so switching it on leaves no gap', async () => {
    const container = await AstroContainer.create();

    expect((await container.renderToString(ShopTeaser, { props: { copy: {} } })).trim()).toBe('');
  });
});
