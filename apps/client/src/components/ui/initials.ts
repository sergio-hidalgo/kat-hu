/**
 * The avatar's letters: the first letter of the first two words of a name,
 * upper case — *Ana García* → *AG*, *Ana* → *A*. Letters, not code units, so
 * an accented or composed initial (*Álvaro*) survives whole.
 */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word.normalize('NFC'))[0] ?? '')
    .join('')
    .toLocaleUpperCase('es-ES');
}
