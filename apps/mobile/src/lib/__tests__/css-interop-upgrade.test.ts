/**
 * Purpose: Gate-test that no screen, component, or feature conditionally adds a
 *   CSS-variable-setting utility (the `shadow-*` family) to a component that
 *   renders without one on the other branch, and that every cva variant map
 *   declares shadows uniformly across its entries.
 * Why important: `shadow-card` compiles to `--tw-shadow*` variable
 *   declarations. css-interop 0.2.6 marks a component that STARTS setting
 *   variables after its first render as SHOULD_UPGRADE, then prints a dev
 *   warning. That warning serializes props with a hand-rolled JSON.stringify
 *   that recurses through `Object.entries` — which walks into React
 *   Navigation's default NavigationStateContext, whose getters throw
 *   "Couldn't find a navigation context". The throw escapes render and kills
 *   the screen. Symptom: switching to dark mode on Settings, and confirming on
 *   the incoming-tenant screen, both crashed with a bogus navigation error.
 *   A dynamic `variant` prop crossing a shadow boundary is the same hazard by
 *   another route, hence the cva half. Found 2026-08-03.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  SHADOW_NEUTRAL,
  SHADOW_UTILITY,
  extractVariantGroups,
  findAsymmetricShadowTernaries,
} from '../shadow-uniformity';

// Every directory that renders className-carrying JSX. `components` matters as
// much as `screens`: card.tsx and dialog.tsx both carry shadows, and a future
// conditional there would crash exactly the same way.
const srcRoot = path.resolve(__dirname, '../..');
const scanRoots = ['screens', 'components', 'features'].map((d) => path.join(srcRoot, d));
const variantsRoot = path.resolve(srcRoot, 'components/ui/variants');

function walk(dir: string, ext = '.tsx'): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full, ext);
    return entry.name.endsWith(ext) ? [full] : [];
  });
}

describe('css-interop variable-upgrade safety', () => {
  const files = scanRoots.flatMap((root) => walk(root));

  it('scans screens, components, and features', () => {
    const covered = new Set(files.map((f) => path.relative(srcRoot, f).split(path.sep)[0]));
    expect([...covered].sort()).toEqual(['components', 'features', 'screens']);
  });

  it.each(files.map((f) => [path.relative(srcRoot, f), f]))(
    '%s does not add a shadow utility on only one branch',
    (_label, file) => {
      const offenders = findAsymmetricShadowTernaries(fs.readFileSync(file, 'utf8'));
      expect(offenders).toEqual([]);
    },
  );
});

describe('findAsymmetricShadowTernaries', () => {
  it('flags a shadow added on only one branch', () => {
    const source = `className={sel ? 'bg-card shadow-card' : 'py-2.5'}`;
    expect(findAsymmetricShadowTernaries(source)).toHaveLength(1);
  });

  it('accepts the shadow-none counterweight', () => {
    const source = `className={sel ? 'bg-card shadow-card' : 'py-2.5 shadow-none'}`;
    expect(findAsymmetricShadowTernaries(source)).toEqual([]);
  });

  it('flags a shadow inside a cn() short-circuit', () => {
    const source = `className={cn('rounded-full', active && 'bg-card shadow-card')}`;
    expect(findAsymmetricShadowTernaries(source)).toEqual([`&& 'bg-card shadow-card'`]);
  });

  it('ignores a short-circuit with no shadow', () => {
    const source = `className={cn('rounded-full', focused && 'border-primary')}`;
    expect(findAsymmetricShadowTernaries(source)).toEqual([]);
  });

  it('ignores prose in comments that mentions shadow utilities', () => {
    const source = [
      `      // \`shadow-card\` compiles to --tw-shadow*, so the other branch`,
      `      // needs shadow-none. See the header comment.`,
      `      className={sel ? 'bg-card shadow-card' : 'py-2.5 shadow-none'}`,
    ].join('\n');
    expect(findAsymmetricShadowTernaries(source)).toEqual([]);
  });

  it('accepts a ternary with no shadow on either branch', () => {
    const source = `className={sel ? 'text-foreground' : 'text-muted-foreground'}`;
    expect(findAsymmetricShadowTernaries(source)).toEqual([]);
  });

  it('accepts a shadow present on both branches', () => {
    const source = `className={sel ? 'bg-card shadow-card' : 'bg-surface shadow-card'}`;
    expect(findAsymmetricShadowTernaries(source)).toEqual([]);
  });
});

// A cva variant map is the same hazard by another route: components take a
// dynamic `variant` prop (e.g. `variant={confirmed ? 'success' : 'warning'}`),
// so if one variant sets shadow variables and another does not, switching
// between them mid-life triggers the identical upgrade crash. Every entry in a
// variant group must therefore agree on whether it carries a shadow-* utility.
describe('cva variant maps declare shadows uniformly', () => {
  const files = walk(variantsRoot, '.ts');

  it('finds variant modules to scan', () => {
    expect(files.map((f) => path.basename(f)).sort()).toEqual([
      'badge-variants.ts',
      'button-variants.ts',
      'chip-variants.ts',
    ]);
  });

  it.each(files.map((f) => [path.basename(f), f]))('%s', (_label, file) => {
    const groups = extractVariantGroups(fs.readFileSync(file, 'utf8'));

    // Guard against a silently vacuous pass: every variant module here defines
    // at least one group with at least two entries.
    expect(groups.length).toBeGreaterThan(0);

    for (const { group, entries } of groups) {
      const values = Object.values(entries);
      expect(values.length).toBeGreaterThan(1);

      const declaring = values.filter((v) => SHADOW_UTILITY.test(v) || SHADOW_NEUTRAL.test(v));

      // Either no entry declares a shadow, or every entry does.
      if (declaring.length === 0) continue;
      expect({ group, declaring: declaring.length, total: values.length }).toEqual({
        group,
        declaring: values.length,
        total: values.length,
      });
    }
  });
});

describe('extractVariantGroups', () => {
  const source = `
    export const x = cva('base', {
      variants: {
        variant: { a: 'bg-primary shadow-card', b: 'bg-secondary' },
        size: { sm: 'py-2', lg: 'py-4' },
      },
      defaultVariants: { variant: 'a', size: 'sm' },
    });
  `;

  it('reads every group and entry', () => {
    expect(extractVariantGroups(source)).toEqual([
      { group: 'variant', entries: { a: 'bg-primary shadow-card', b: 'bg-secondary' } },
      { group: 'size', entries: { sm: 'py-2', lg: 'py-4' } },
    ]);
  });

  it('ignores defaultVariants', () => {
    const groups = extractVariantGroups(source);
    expect(groups.map((g) => g.group)).not.toContain('defaultVariants');
  });

  it('reads both cva calls in one file', () => {
    expect(extractVariantGroups(`${source}\n${source}`)).toHaveLength(4);
  });

  it('does not mistake a commented-out class for a real one', () => {
    const commented = `
      export const y = cva('base', {
        variants: {
          // variant: { a: 'shadow-card', b: 'nope' },
          tone: { a: 'shadow-card', b: 'shadow-none' },
        },
      });
    `;
    expect(extractVariantGroups(commented).map((g) => g.group)).toEqual(['tone']);
  });
});
