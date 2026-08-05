/**
 * Purpose: Gate test that the "Available from" field uses a picker, not free
 * text, so every listing carries the same canonical YYYY-MM-DD shape and an
 * invalid date cannot be entered.
 * Why important: the field was free text and anything unparseable was silently
 * replaced with today+30 days on submit (mobile-app-provider.tsx:489-492 in
 * the old code), so a listing could publish a move-in date nobody picked. The
 * picker makes the bad state unrepresentable instead of validated after the
 * fact. Reading the source is the available deterministic check — the mobile
 * jest lane has no renderer.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';
// Relative, not '@/…': the gate lane's jest config has no moduleNameMapper.
import { stripComments } from '../../../lib/jsx-nesting';

const srcDir = path.resolve(__dirname, '../../..');
const read = (relativePath: string) =>
  stripComments(fs.readFileSync(path.join(srcDir, relativePath), 'utf8'));

const dateFieldSource = read('components/ui/date-field.tsx');
const createListingSource = read('screens/CreateListingFlowScreens.tsx');
const submitSource = read('features/mobile-app/mobile-app-provider.tsx');

describe('DateField component', () => {
  it('uses the native date picker, not a text input', () => {
    expect(dateFieldSource).toContain('@react-native-community/datetimepicker');
    expect(dateFieldSource).toContain('<DateTimePicker');
  });

  it('stores one canonical YYYY-MM-DD value', () => {
    // The deterministic module enforces the shape; the component just calls it.
    expect(dateFieldSource).toContain("from '@/lib/listings/available-from'");
    expect(dateFieldSource).toContain('toISODate(date)');
  });

  it('shows a readable label like "15 April 2026"', () => {
    expect(dateFieldSource).toContain('formatAvailableFrom(');
  });

  it('enforces a minimum date so a past move-in cannot be picked', () => {
    expect(dateFieldSource).toContain('minimumDate={minimumDate}');
  });
});

describe('CreateListingFlowScreens', () => {
  it('uses the picker for "Available from", not a free-text Field', () => {
    expect(createListingSource).toContain('<DateField');
    expect(createListingSource).toContain('label="Available from"');
    // The old free-text field would have had onChangeText.
    expect(createListingSource).toContain('value={draft.availableFrom}');
    expect(createListingSource).toContain('onChange={(value) => updateDraft({ availableFrom: value })}');
  });

  it('sets the minimum to today', () => {
    expect(createListingSource).toContain('minimumDate={minimumAvailableFrom(new Date())}');
  });
});

describe('submit path', () => {
  it('converts the canonical date to the API instant', () => {
    expect(submitSource).toContain('toApiInstant(draft.availableFrom)');
  });

  it('refuses when the date is unset, instead of inventing today+30 days', () => {
    // The old fallback was `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`.
    expect(submitSource).toContain("throw new Error('Pick the date this home becomes available.');");
    expect(submitSource).not.toContain('Date.now() + 30');
  });

  it('uses the readable label in the auto-generated description', () => {
    expect(submitSource).toContain('formatAvailableFrom(draft.availableFrom)');
  });
});
