'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type ConfirmConnectionFormProps = {
  unlockId: string;
};

const checklistItems = [
  "I've viewed the property in person",
  "I've been approved by the landlord",
  "I'm moving in within 30 days",
  'I understand this confirmation is binding',
];

export function ConfirmConnectionForm({ unlockId }: ConfirmConnectionFormProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [moveInDate, setMoveInDate] = useState('2026-04-01');
  const [notes, setNotes] = useState('');

  const canSubmit = useMemo(
    () => checklistItems.every((item) => checkedItems.includes(item)),
    [checkedItems],
  );

  function toggleItem(item: string) {
    setCheckedItems((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }

  return (
    <div className="space-y-8 rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:p-10">
      <div>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.04em] text-[#252525]">
          Are you moving into this property?
        </h2>
        <p className="mt-3 text-base leading-7 text-[#8D9192]">
          Only confirm if you are actually taking the apartment.
        </p>
      </div>

      <div className="space-y-4">
        {checklistItems.map((item) => {
          const checked = checkedItems.includes(item);

          return (
            <label
              key={item}
              className="flex cursor-pointer items-start gap-4 rounded-[18px] border border-[#EDEDED] px-5 py-4"
            >
              <span
                className={`mt-1 inline-flex size-6 shrink-0 rounded-[6px] border-2 ${
                  checked ? 'border-[#28809A] bg-[#28809A]' : 'border-[#c9c9c9] bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(item)}
                  className="sr-only"
                />
              </span>
              <span className="text-base text-[#252525]">{item}</span>
            </label>
          );
        })}
      </div>

      <div className="rounded-[18px] border-l-4 border-amber-400 bg-amber-50 px-5 py-5">
        <p className="text-base font-semibold text-[#252525]">Please Note</p>
        <p className="mt-2 text-sm leading-6 text-[#8D9192]">
          False confirmations may result in account suspension.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="move-in-date" className="text-sm font-semibold text-[#252525]">
            Move-in Date
          </label>
          <input
            id="move-in-date"
            type="date"
            value={moveInDate}
            onChange={(event) => setMoveInDate(event.target.value)}
            className="mt-2 h-12 w-full rounded-[18px] border border-[#EDEDED] px-4 text-sm text-[#252525] outline-none focus:border-[#28809A]"
          />
        </div>
        <div>
          <label htmlFor="confirmation-notes" className="text-sm font-semibold text-[#252525]">
            Additional Notes
          </label>
          <textarea
            id="confirmation-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, 200))}
            placeholder="Any special arrangements..."
            className="mt-2 min-h-[120px] w-full rounded-[18px] border border-[#EDEDED] px-4 py-4 text-sm text-[#252525] outline-none focus:border-[#28809A]"
          />
          <p className="mt-2 text-right text-xs text-[#8D9192]">{notes.length}/200</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href={`/unlocks/${unlockId}`}
          aria-disabled={!canSubmit}
          className={`inline-flex h-14 w-full items-center justify-center rounded-full text-sm font-semibold ${
            canSubmit ? 'bg-[#28809A] text-white' : 'bg-[#d8d8d8] text-white pointer-events-none'
          }`}
        >
          Confirm I&apos;m Moving In
        </Link>
        <Link
          href={`/unlocks/${unlockId}`}
          className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[#EDEDED] text-sm font-semibold text-[#8D9192]"
        >
          Not Yet
        </Link>
      </div>
    </div>
  );
}
