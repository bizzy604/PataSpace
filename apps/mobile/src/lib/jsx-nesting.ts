/**
 * Purpose: Static-analysis helper that answers "is this bit of JSX rendered
 *   inside an element of the given tag?" by counting unclosed opening tags
 *   before it.
 * Why important: The mobile jest lane transforms `.ts` only and runs on the
 *   node environment, so there is no renderer to mount a component and assert
 *   what is pressable. Reading the source is the available deterministic check,
 *   the same approach lib/shadow-uniformity.ts already takes.
 * Used by: lib/__tests__/listing-card-tap-target.test.ts.
 */

/**
 * Drop `//` lines, `/* *\/` blocks, and `{/* *\/}` JSX comments, so prose that
 * mentions a tag name never counts as markup.
 */
export function stripComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
}

/**
 * True when `needle` sits inside an open `<tag>` element.
 *
 * Counts `<Tag` openings minus `<Tag ... />` self-closings minus `</Tag>`
 * closings in the source before the needle: a positive balance means at least
 * one enclosing element is still open.
 *
 * Two deliberate limits, both fine for the files this gates:
 * - self-closing detection uses `[^<>]*`, so a prop value containing a literal
 *   `>` (an inline arrow function, say) would read as non-self-closing.
 * - `needle` must be unique in the file; a repeated one finds only the first.
 * Both throw or misreport loudly rather than passing silently, which is the
 * property that matters for a gate.
 */
export function isInsideElement(source: string, tag: string, needle: string): boolean {
  const clean = stripComments(source);
  const at = clean.indexOf(needle);
  if (at === -1) {
    throw new Error(`needle not found in source: ${needle}`);
  }
  if (clean.indexOf(needle, at + 1) !== -1) {
    throw new Error(`needle is not unique, so nesting is ambiguous: ${needle}`);
  }

  const before = clean.slice(0, at);
  const count = (pattern: RegExp) => [...before.matchAll(pattern)].length;

  const opened = count(new RegExp(`<${tag}\\b`, 'g'));
  const selfClosed = count(new RegExp(`<${tag}\\b[^<>]*/>`, 'g'));
  const closed = count(new RegExp(`</${tag}\\s*>`, 'g'));

  return opened - selfClosed - closed > 0;
}
