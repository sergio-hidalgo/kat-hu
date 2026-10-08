import { cardsPerView, currentPage, nextPage, pageCount } from './carousel';

/** Time on each page before the track slides on (owner, 2026-10-01). */
export const SLIDE_EVERY_MS = 20_000;

/**
 * Brings a carousel (`ui/Carousel.astro`, spec 05e) to life: the dots below
 * jump to a page, the arrow keys move the focused track one page, and
 * dragging or scrolling the track works as well (scroll snap).
 *
 * **It only slides on its own when the root says `data-autoplay`** — the
 * testimonials: every 20 seconds a page to the right and, after the last, back
 * round to the first. Sessions, steps and drops are things a reader compares
 * and acts on, so they never move by themselves (WCAG 2.2.2). Autoplay does
 * not run while the pointer or focus is inside, while the tab is hidden, or for
 * a reader who asked for reduced motion, who gets the dots and no autoplay.
 *
 * Without JavaScript the track is still a row to scroll by hand. With one page
 * — every card in view, or a track that does not scroll, as on a desktop row —
 * the dots stay hidden and nothing moves. Each card is announced as a slide,
 * *N de M*.
 */
export function initCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-track]');
  const dots = root.querySelector<HTMLElement>('[data-dots]');
  const dotTemplate = root.querySelector<HTMLTemplateElement>('template[data-dot]');
  if (!track || !dots || !dotTemplate || track.children.length < 2) return;

  const cards = Array.from(track.children) as HTMLElement[];
  const autoplay = root.hasAttribute('data-autoplay');
  cards.forEach((card, index) => {
    // Only a plain `div` takes the group role. A list item keeps its own (an
    // `ol`'s children must be `li`s, and the list already says "n de M"), and a
    // `figure` may not have one (Lighthouse's aria-allowed-role).
    if (card.tagName === 'DIV') {
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
    }
    card.setAttribute('aria-label', `${index + 1} de ${cards.length}`);
  });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let step = 0;
  let pages = 1;
  let timer: number | undefined;
  let held = false;

  const measure = () => {
    const pitch = cards[1].offsetLeft - cards[0].offsetLeft;
    const perView = cardsPerView({
      trackWidth: track.clientWidth,
      cardWidth: cards[0].offsetWidth,
      pitch,
    });
    step = pitch * perView;
    // A track that does not scroll (the cards sit in a row from `lg`) has one page.
    pages = maxScroll() <= 1 ? 1 : pageCount(cards.length, perView);
  };
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const page = () =>
    currentPage({
      scrollLeft: track.scrollLeft,
      maxScroll: maxScroll(),
      step,
      pages,
    });

  const show = (index: number) => {
    track.scrollTo({
      left: index * step,
      behavior: reduced.matches ? 'auto' : 'smooth',
    });
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (!autoplay || pages <= 1 || reduced.matches || held) return;
    timer = window.setTimeout(() => {
      if (!document.hidden) show(nextPage(page(), pages));
      schedule();
    }, SLIDE_EVERY_MS);
  };

  const mark = () => {
    const now = page();
    dots.querySelectorAll('button').forEach((dot, index) => {
      dot.setAttribute('aria-current', String(index === now));
    });
  };

  const build = () => {
    measure();
    dots.hidden = pages <= 1;
    dots.replaceChildren();
    for (let index = 0; index < pages && pages > 1; index++) {
      const dot = (dotTemplate.content.cloneNode(true) as DocumentFragment).querySelector('button')!;
      dot.setAttribute('aria-label', `Ir al grupo ${index + 1} de ${pages}`);
      dot.addEventListener('click', () => {
        show(index);
        schedule();
      });
      dots.append(dot);
    }
    mark();
    schedule();
  };

  track.addEventListener('keydown', (event) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta || pages <= 1) return;
    const target = page() + delta;
    if (target < 0 || target >= pages) return;
    event.preventDefault();
    show(target);
    schedule();
  });

  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(mark);
  });

  // A hand on the track — pointer, finger or keyboard — restarts the clock,
  // and the track holds still while it is there.
  const hold = () => {
    held = true;
    schedule();
  };
  const release = () => {
    held = false;
    schedule();
  };
  root.addEventListener('pointerenter', hold);
  root.addEventListener('pointerleave', release);
  root.addEventListener('focusin', hold);
  root.addEventListener('focusout', release);
  reduced.addEventListener('change', schedule);

  new ResizeObserver(build).observe(track);
  build();
}
