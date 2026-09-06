/**
 * The control classes from guide §7.6, in one place so a `<textarea>` or a
 * `<select>` slotted into `Field.astro` looks identical to the `<input>` the
 * field renders itself. Astro slots cannot receive props, hence the function.
 */
export function fieldControlClass({
  surface = 'shell',
  error = false,
  textarea = false,
}: {
  /** Shell on a Cloud card, Cloud on a Shell section — guide §3.2. */
  surface?: 'shell' | 'cloud';
  error?: boolean;
  textarea?: boolean;
} = {}): string {
  return [
    'block w-full rounded-sm border px-4 font-body text-sm text-ink',
    'placeholder:text-slate focus:border-violet-600',
    textarea ? 'min-h-35 py-3' : 'h-12',
    surface === 'shell' ? 'bg-shell' : 'bg-cloud',
    error ? 'border-red' : 'border-mist',
  ].join(' ');
}
