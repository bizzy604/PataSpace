/**
 * Gate test: installed dependency versions must stay aligned with the
 * installed Expo SDK.
 *
 * Regression guard for the Jul 2026 Dependabot bump (6f2f517) that moved react
 * to 19.2.7 while Expo SDK 54 / react-native 0.81 require react 19.1.0 exactly.
 * That mismatch makes the bundled React renderer fail to initialize and every
 * screen crash in Expo Go / dev clients with:
 *   "Cannot read property 'default' of undefined" (findNodeHandle).
 *
 * Source of truth is expo's own bundledNativeModules.json (same data
 * `expo install --check` uses), so this test keeps working across SDK
 * upgrades without edits.
 */
import * as path from "path";

type Triple = [number, number, number];

function parseBase(v: string): Triple | null {
  const m = v.match(/^[\^~]?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function cmp(a: Triple, b: Triple): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/** Supports the range shapes bundledNativeModules.json uses: exact, ~, ^, *. */
function satisfies(version: Triple, range: string): boolean {
  if (range === "*") return true;
  const base = parseBase(range);
  if (!base) throw new Error(`Unsupported range format: ${range}`);
  if (range.startsWith("~")) {
    return cmp(version, base) >= 0 && cmp(version, [base[0], base[1] + 1, 0]) < 0;
  }
  if (range.startsWith("^")) {
    const upper: Triple =
      base[0] > 0 ? [base[0] + 1, 0, 0] : [0, base[1] + 1, 0];
    return cmp(version, base) >= 0 && cmp(version, upper) < 0;
  }
  return cmp(version, base) === 0;
}

function installedVersion(name: string): string {
  const pkgJson = require(
    require.resolve(path.join(name, "package.json"), {
      paths: [path.resolve(__dirname, "../../..")],
    }),
  ) as { version: string };
  return pkgJson.version;
}

const appPkg = require("../../../package.json") as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const expected = require("expo/bundledNativeModules.json") as Record<
  string,
  string
>;

const declared: Record<string, string> = {
  ...appPkg.dependencies,
  ...appPkg.devDependencies,
};
const shared = Object.keys(declared).filter((name) => expected[name]);

describe("Expo SDK dependency alignment", () => {
  it("covers the packages that broke Expo Go before", () => {
    expect(shared).toEqual(
      expect.arrayContaining(["react", "react-dom", "react-native"]),
    );
  });

  it.each(shared)(
    "%s installed version satisfies the SDK expectation",
    (name) => {
      const version = installedVersion(name);
      const parsed = parseBase(version);
      expect(parsed).not.toBeNull();
      expect({ name, installed: version, expected: expected[name] }).toEqual(
        expect.objectContaining({
          // satisfies() is the assertion; inputs are embedded so a failure
          // prints the offending versions.
          name: satisfies(parsed as Triple, expected[name])
            ? name
            : "MISALIGNED",
        }),
      );
    },
  );
});
