// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

/**
 * The runtime floor (`^24.15.0 || >=26.0.0`, spec 03b) exists because `jsdom`
 * asks for it: on the Node 24 line it needs `24.15.0`, above what the old
 * `>=22.12.0` floor allowed. Nothing renders in jsdom yet — the React islands
 * arrive with spec 06 — so this suite is the guard that the environment those
 * islands opt into actually boots on the Node we pin in `.nvmrc`.
 */
describe('the jsdom environment', () => {
  it('gives a test a live DOM to render into', () => {
    const element = document.createElement('p');
    element.textContent = 'Reserva tu sesión';
    document.body.append(element);

    expect(document.body.querySelector('p')?.textContent).toBe(
      'Reserva tu sesión',
    );
  });
});
