import { getMockListingById } from "./mock-listings";

export const mockCurrentUser = {
  id: "user-1",
  firstName: "Amina",
  lastName: "Njeri",
  phoneNumber: "+254701234567",
  email: "amina@pataspace.test",
  role: "user",
  phoneVerified: true,
  createdAt: "2025-12-09T00:00:00.000Z",
};

export const mockCreditBalance = {
  balance: 6400,
  lifetimeEarned: 16200,
  lifetimeSpent: 9800,
  pendingCommissions: 0,
};

export const creditPackages = [
  {
    id: "5_credits",
    name: "Starter",
    amount: 500,
    credits: 5,
    description: "A small top-up for one lower-rent unlock.",
  },
  {
    id: "10_credits",
    name: "Search Sprint",
    amount: 1000,
    credits: 10,
    description: "Balanced package for active weekly browsing.",
    recommended: true,
  },
  {
    id: "20_credits",
    name: "Fast Track",
    amount: 2000,
    credits: 20,
    description: "Best for comparing multiple serious options quickly.",
  },
] as const;

export type MockTransaction = {
  id: string;
  type: "PURCHASE" | "SPEND" | "REFUND" | "BONUS";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
  description: string;
  mpesaReceiptNumber?: string;
  unlockId?: string;
  createdAt: string;
};

export const mockTransactions: MockTransaction[] = [
  {
    id: "txn-1",
    type: "PURCHASE",
    amount: 2000,
    balanceBefore: 4400,
    balanceAfter: 6400,
    status: "COMPLETED",
    description: "Credit purchase - Fast Track package",
    mpesaReceiptNumber: "RCK9D8P1",
    createdAt: "2026-03-28T08:45:00.000Z",
  },
  {
    id: "txn-2",
    type: "SPEND",
    amount: -2500,
    balanceBefore: 6900,
    balanceAfter: 4400,
    status: "COMPLETED",
    description: "Unlocked Sunny 2BR handover near Yaya Centre",
    unlockId: "unlock-1",
    createdAt: "2026-03-26T15:12:00.000Z",
  },
  {
    id: "txn-3",
    type: "REFUND",
    amount: 1450,
    balanceBefore: 2950,
    balanceAfter: 4400,
    status: "REFUNDED",
    description: "Refund after listing dispute resolution",
    unlockId: "unlock-2",
    createdAt: "2026-03-22T10:20:00.000Z",
  },
  {
    id: "txn-4",
    type: "PURCHASE",
    amount: 1000,
    balanceBefore: 1950,
    balanceAfter: 2950,
    status: "COMPLETED",
    description: "Credit purchase - Search Sprint package",
    mpesaReceiptNumber: "RBY3P1Q9",
    createdAt: "2026-03-21T19:30:00.000Z",
  },
];

export type MockUnlockStatus =
  | "pending_confirmation"
  | "confirmed"
  | "disputed"
  | "refunded";

export type MockUnlock = {
  unlockId: string;
  listingId: string;
  creditsSpent: number;
  createdAt: string;
  status: MockUnlockStatus;
  myConfirmation: string | null;
  tenantConfirmation: string | null;
  nextStep: string;
};

export const mockUnlocks: MockUnlock[] = [
  {
    unlockId: "unlock-1",
    listingId: "listing-1",
    creditsSpent: 2500,
    createdAt: "2026-03-26T15:12:00.000Z",
    status: "pending_confirmation",
    myConfirmation: "2026-03-27T09:10:00.000Z",
    tenantConfirmation: null,
    nextStep: "Waiting for the current tenant to confirm the connection.",
  },
  {
    unlockId: "unlock-2",
    listingId: "listing-2",
    creditsSpent: 1450,
    createdAt: "2026-03-19T13:05:00.000Z",
    status: "refunded",
    myConfirmation: "2026-03-20T12:00:00.000Z",
    tenantConfirmation: null,
    nextStep: "Refund issued after dispute review.",
  },
  {
    unlockId: "unlock-3",
    listingId: "listing-3",
    creditsSpent: 4200,
    createdAt: "2026-03-10T11:20:00.000Z",
    status: "confirmed",
    myConfirmation: "2026-03-11T08:15:00.000Z",
    tenantConfirmation: "2026-03-11T18:40:00.000Z",
    nextStep: "Both sides confirmed. Commission clock is running on the owner side.",
  },
];

export type MockDispute = {
  id: string;
  unlockId: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  reason: string;
  resolution?: string;
  createdAt: string;
};

export const mockDisputes: MockDispute[] = [
  {
    id: "dispute-1",
    unlockId: "unlock-2",
    status: "RESOLVED",
    reason: "The property condition did not match the uploaded evidence.",
    resolution: "Full refund approved after admin review.",
    createdAt: "2026-03-20T18:00:00.000Z",
  },
];

export const supportTopics = [
  {
    title: "How unlocking works",
    body: "You browse for free and only spend credits when you reveal verified contact details for a listing.",
  },
  {
    title: "When refunds happen",
    body: "Refunds are considered when a dispute is validated or the documented rejection path applies.",
  },
  {
    title: "M-Pesa timing",
    body: "Most STK pushes complete quickly, but stale pending transactions are reconciled automatically by the backend.",
  },
];

export type MockSupportRequest = {
  id: string;
  subject: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  channel: "WhatsApp" | "Email";
  summary: string;
  updatedAt: string;
  relatedUnlockId?: string;
};

export const mockSupportRequests: MockSupportRequest[] = [
  {
    id: "support-1",
    subject: "Pending M-Pesa prompt follow-up",
    status: "IN_REVIEW",
    channel: "WhatsApp",
    summary: "STK push arrived late and the transaction stayed pending for fifteen minutes.",
    updatedAt: "2026-03-29T08:10:00.000Z",
  },
  {
    id: "support-2",
    subject: "Unlock refund clarification",
    status: "RESOLVED",
    channel: "Email",
    summary: "Requested confirmation that refunded credits for unlock-2 were restored correctly.",
    updatedAt: "2026-03-23T16:45:00.000Z",
    relatedUnlockId: "unlock-2",
  },
  {
    id: "support-3",
    subject: "Need call guidance before confirm move-in",
    status: "OPEN",
    channel: "WhatsApp",
    summary: "Asked for the safest way to document a successful handover before both parties confirm.",
    updatedAt: "2026-03-30T11:55:00.000Z",
    relatedUnlockId: "unlock-1",
  },
];

export const mockSavedListingIds = ["listing-1", "listing-3"];

export const mockRecentSearches = [
  {
    label: "Kilimani 2 bedroom",
    href: "/search?q=Kilimani%202%20bedroom",
    note: "Strong fit for mid-range apartment handovers.",
  },
  {
    label: "Westlands furnished",
    href: "/search?q=Westlands%20furnished",
    note: "Useful for move-in-ready shortlisting.",
  },
  {
    label: "South B studio",
    href: "/search?q=South%20B%20studio",
    note: "Budget search with commuter access.",
  },
] as const;

export function getMockTransactionById(id: string) {
  return mockTransactions.find((transaction) => transaction.id === id);
}

export function getMockUnlockById(id: string) {
  return mockUnlocks.find((unlock) => unlock.unlockId === id);
}

export function getMockDisputeByUnlockId(unlockId: string) {
  return mockDisputes.find((dispute) => dispute.unlockId === unlockId);
}

export function getMockUnlockBundle(unlockId: string) {
  const unlock = getMockUnlockById(unlockId);

  if (!unlock) {
    return null;
  }

  const listing = getMockListingById(unlock.listingId);

  if (!listing) {
    return null;
  }

  return {
    unlock,
    listing,
    dispute: getMockDisputeByUnlockId(unlockId),
  };
}
