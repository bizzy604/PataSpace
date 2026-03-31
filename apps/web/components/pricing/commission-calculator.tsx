'use client';

import { useState } from 'react';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-KE').format(value);
}

export function CommissionCalculator() {
  const [rent, setRent] = useState(25000);
  const unlockFee = Math.round(rent * 0.1);
  const earnings = Math.round(unlockFee * 0.3);

  return (
    <div className="rounded-[24px] border border-[#EDEDED] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Commission calculator</p>
      <div className="mt-5 rounded-[18px] border border-[#EDEDED] bg-[#fafafa] px-4 py-4">
        <label htmlFor="rent-input" className="text-sm font-semibold text-[#252525]">
          Monthly rent
        </label>
        <div className="mt-3 flex items-center gap-3 rounded-full border border-[#d7d7d7] bg-white px-4 py-3">
          <span className="text-sm font-semibold text-[#8D9192]">KES</span>
          <input
            id="rent-input"
            type="number"
            min={10000}
            step={1000}
            value={rent}
            onChange={(event) => setRent(Number(event.target.value) || 0)}
            className="w-full bg-transparent text-lg font-semibold text-[#252525] outline-none"
          />
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[18px] bg-[#EDEDED] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D9192]">Unlock fee</p>
          <p className="mt-2 font-display text-2xl font-semibold text-[#252525]">KES {formatNumber(unlockFee)}</p>
        </div>
        <div className="rounded-[18px] bg-[#EDEDED] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D9192]">Commission rate</p>
          <p className="mt-2 font-display text-2xl font-semibold text-[#252525]">30%</p>
        </div>
        <div className="rounded-[18px] bg-[#28809A] px-4 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/74">You earn</p>
          <p className="mt-2 font-display text-2xl font-semibold">KES {formatNumber(earnings)}</p>
        </div>
      </div>
    </div>
  );
}
