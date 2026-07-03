/**
 * Purpose: Transport types for the admin dashboard metrics endpoint
 *   (GET /admin/metrics).
 * Why important: One summary payload drives the admin console's dashboard
 *   tiles; keeping it in contracts means the web tiles and API aggregation
 *   cannot drift apart silently.
 * Used by: apps/api modules/admin, apps/web /admin dashboard.
 */
export type AdminMetricsResponse = {
  users: {
    total: number;
    banned: number;
    newLast7Days: number;
  };
  listings: {
    total: number;
    pending: number;
    active: number;
    rejected: number;
  };
  unlocks: {
    total: number;
    last7Days: number;
  };
  disputes: {
    open: number;
    investigating: number;
  };
  commissions: {
    pendingCount: number;
    pendingAmountKES: number;
    paidCount: number;
    paidAmountKES: number;
  };
  supportTickets: {
    open: number;
  };
  trust: {
    refundsTotal: number;
    landlordDeclinedRefunds: number;
    landlordDeclinedShare: number;
  };
  flywheel: {
    confirmedMoveIns: number;
    seededListings: number;
    moverToPosterRate: number;
  };
  successFees: {
    partialCount: number;
    settledCount: number;
    collectedKes: number;
  };
  generatedAt: string;
};
