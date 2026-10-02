/**
 * The control classes from guide §07, *Formularios*, in one place so a
 * `<textarea>` or a `<select>` slotted into `Field.astro` looks identical to
 * the `<input>` the field renders itself. Astro slots cannot receive props,
 * hence the function.
 *
 * 48px, Crema, a Piedra-fuerte border (3.7:1, clear of the 3:1 a control's
 * edge needs); Grafito on hover; Violeta with the focus ring on focus; a 2px
 * error border. Forms live on Crema — on Lavanda they go inside a card.
 */
export function fieldControlClass({
  error = false,
  textarea = false,
}: {
  error?: boolean;
  textarea?: boolean;
} = {}): string {
  return [
    'block w-full rounded bg-cream px-3.5 font-body text-sm text-ink',
    'transition-[border-color,box-shadow] duration-fast',
    'placeholder:text-slate hover:border-graphite',
    'focus:border-violet focus:shadow-[var(--field-focus-shadow)]',
    textarea ? 'min-h-35 py-3' : 'h-12',
    error ? 'border-2 border-error' : 'border border-stone-strong',
  ].join(' ');
}
