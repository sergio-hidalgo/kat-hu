import { useEffect, useState } from 'react';

/**
 * The smallest possible React island: proof that the integration added in
 * spec 04 actually hydrates. It lives on `/estilo` and nowhere else.
 *
 * The real islands come later, where state genuinely lives — the booking form
 * (spec 06) and the cart (spec 11). Everything else stays `.astro`
 * (`apps/client/AGENTS.md`), so this file is the only `.tsx` in the app today.
 *
 * The button borrows `Button.astro`'s primary classes rather than importing
 * it: an `.astro` component cannot render inside an island. If those classes
 * drift, this probe is the place that is allowed to be a little stale — it is
 * a runtime check, not a design reference.
 */
export default function HydrationProbe() {
  /* Server-rendered as `false`; only a hydrated island ever flips it. */
  const [hydrated, setHydrated] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => setHydrated(true), []);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-body text-sm text-graphite">
        {hydrated
          ? 'Isla hidratada — React responde en el navegador.'
          : 'Renderizada en el servidor, todavía sin hidratar.'}
      </p>
      <button
        type="button"
        onClick={() => setCount((value) => value + 1)}
        className="inline-flex h-13 items-center justify-center rounded-sm bg-violet-700 px-6 font-body text-sm font-semibold text-cloud transition-colors duration-fast hover:bg-violet-600 active:bg-violet-700 md:h-12"
      >
        {count === 0
          ? 'Púlsame'
          : `Has pulsado ${count} ${count === 1 ? 'vez' : 'veces'}`}
      </button>
    </div>
  );
}
