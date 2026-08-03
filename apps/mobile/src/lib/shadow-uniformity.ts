/**
 * Purpose: Static-analysis helpers that find className code where a
 *   CSS-variable-setting `shadow-*` utility is present on one branch of a
 *   condition and absent on the other.
 * Why important: `shadow-card` compiles to `--tw-shadow*` variable
 *   declarations. css-interop 0.2.6 flags a mounted component that STARTS
 *   setting variables on a later render as SHOULD_UPGRADE and prints a dev
 *   warning whose serializer walks `Object.entries` into React Navigation's
 *   throwing context getters, which crashes the screen with a bogus
 *   "Couldn't find a navigation context". Keeping shadow presence uniform means
 *   the upgrade never fires. Found 2026-08-03.
 * Used by: lib/__tests__/css-interop-upgrade.test.ts.
 */

// Utilities that emit --tw-shadow* declarations. `shadow-none` is the neutral
// member: it sets the same variables to a no-op value, so pairing it with a
// real shadow on the other branch keeps the component "variable-setting" from
// render 1 and avoids the upgrade entirely.
export const SHADOW_UTILITY = /\bshadow-(card|floating|sidebar)\b/;
export const SHADOW_NEUTRAL = /\bshadow-none\b/;

/** Drop `//` comment lines so prose about shadows never reads as code. */
function stripLineComments(source: string): string {
  return source.replace(/^[ \t]*\/\/.*$/gm, '');
}

/**
 * Find conditional className strings where a shadow utility appears on only one
 * side of the condition. Covers the two shapes this codebase actually uses:
 *
 *   cond ? 'a' : 'b'    a plain ternary
 *   cn(cond && 'a')     a short-circuit inside cn(), where the falsy branch
 *                       contributes no classes at all, so a shadow utility
 *                       there is asymmetric by construction
 *
 * Deliberately limited to string literals: a computed className cannot be
 * checked statically, and none exist in this codebase today.
 */
export function findAsymmetricShadowTernaries(source: string): string[] {
  const clean = stripLineComments(source);
  const offenders: string[] = [];

  for (const match of clean.matchAll(/\?\s*'([^']*)'\s*:\s*'([^']*)'/g)) {
    const [, left, right] = match;
    const leftHas = SHADOW_UTILITY.test(left);
    if (leftHas === SHADOW_UTILITY.test(right)) continue;

    // The branch without a real shadow must still declare the variables.
    const bare = leftHas ? right : left;
    if (SHADOW_NEUTRAL.test(bare)) continue;

    offenders.push(`'${left}' : '${right}'`);
  }

  // `x && 'shadow-card'` has no else-branch to counterweight it, so any real
  // shadow utility inside one is asymmetric by construction.
  for (const match of clean.matchAll(/&&\s*'([^']*)'/g)) {
    if (SHADOW_UTILITY.test(match[1])) offenders.push(`&& '${match[1]}'`);
  }

  return offenders;
}

export type VariantGroup = { group: string; entries: Record<string, string> };

/** Index of the `}` closing the `{` at `open`, or -1 if unbalanced. */
function matchBrace(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

/**
 * Read the `variants: { group: { key: 'classes' } }` blocks straight out of a
 * cva module's source. cva 0.7.1 keeps its config in a closure and exposes
 * nothing on the returned function (no `.config`), so source is the only place
 * the full map is observable. Reading it here rather than via cva internals is
 * what keeps the gate test from passing vacuously.
 */
export function extractVariantGroups(source: string): VariantGroup[] {
  const clean = stripLineComments(source);
  const groups: VariantGroup[] = [];

  for (const block of clean.matchAll(/\bvariants\s*:\s*\{/g)) {
    const open = block.index + block[0].length - 1;
    const close = matchBrace(clean, open);
    if (close === -1) continue;

    const body = clean.slice(open + 1, close);
    let consumedTo = -1;

    for (const head of body.matchAll(/(\w+)\s*:\s*\{/g)) {
      if (head.index < consumedTo) continue; // nested, not a group of its own
      const groupOpen = head.index + head[0].length - 1;
      const groupClose = matchBrace(body, groupOpen);
      if (groupClose === -1) continue;
      consumedTo = groupClose;

      const entries: Record<string, string> = {};
      for (const pair of body.slice(groupOpen + 1, groupClose).matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
        entries[pair[1]] = pair[2];
      }
      groups.push({ group: head[1], entries });
    }
  }

  return groups;
}
