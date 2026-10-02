import { cardsPerView, currentPage, nextPage, pageCount } from './carousel';

/** Time on each page before the track slides on (owner, 2026-10-01). */
export const SLIDE_EVERY_MS = 20_000;

/**
 * Brings the testimonials carousel to life: the track slides a page to the
 * right every 20 seconds and, after the last, back round to the first; the
 * dots below jump to a page. Dragging or scrolling the track works as well
 * (scroll snap), and every way of moving restarts the clock.
 *
 * Without JavaScript the track is still a row to scroll by hand. It does not
 * advance while the pointer or focus is inside it, while the tab is hidden, or
 * for a reader who asked for reduced motion, who gets the dots and no autoplay.
 * With one page — every card in view — the dots stay hidden and nothing moves.
 */
export function initCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-track]');
  const dots = root.querySelector<HTMLElement>('[data-dots]');
  const dotTemplate = root.querySelector<HTMLTemplateElement>('template[data-dot]');
  if (!track || !dots || !dotTemplate || track.children.length < 2) return;

  const cards = Array.from(track.children) as HTMLElement[];
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
    pages = pageCount(cards.length, perView);
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
    if (pages <= 1 || reduced.matches || held) return;
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
