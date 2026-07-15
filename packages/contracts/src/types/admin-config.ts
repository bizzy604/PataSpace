/**
 * Purpose: Transport types for the admin system-config surface.
 * Why important: The console renders and edits these; API and web share the
 *   shape so an edit round-trips without drift.
 * Used by: apps/api modules/admin, apps/web /admin/config page.
 */
export type AdminConfigEntry = {
  key: string;
  group: 'PRICING' | 'INCENTIVES';
  label: string;
  description: string;
  unit: string;
  kind: 'int' | 'ratio';
  value: number;
  source: 'default' | 'override';
  min: number;
  max: number;
  updatedAt: string | null;
};

export type AdminConfigResponse = {
  data: AdminConfigEntry[];
};

export type UpdateConfigRequest = {
  value: number;
};
