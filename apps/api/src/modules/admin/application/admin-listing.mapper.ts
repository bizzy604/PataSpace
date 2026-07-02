/**
 * Purpose: Pure helpers for admin listing CRUD — where-clause building,
 *   PATCH-payload-to-Prisma-data conversion, and row-to-contract mapping.
 * Why important: Date parsing and filter composition are deterministic logic;
 *   isolating them keeps AdminListingService orchestration-only and makes the
 *   edge cases (null availableTo, deleted visibility) unit-testable.
 * Used by: AdminListingService (modules/admin/application).
 */
import { ListingHouseType, ListingStatus, Prisma } from '@prisma/client';
import {
  AdminListingSummary,
  AdminUpdateListingRequest,
  ListingHouseType as ContractHouseType,
  ListingStatus as ContractListingStatus,
} from '@pataspace/contracts';

export type AdminListingsQuery = {
  page: number;
  limit: number;
  status?: ContractListingStatus;
  search?: string;
  includeDeleted?: 'true' | 'false';
};

type ListingRow = {
  id: string;
  user: { id: string; firstName: string; lastName: string };
  county: string;
  neighborhood: string;
  monthlyRent: number;
  houseType: ListingHouseType;
  status: ListingStatus;
  isApproved: boolean;
  isDeleted: boolean;
  viewCount: number;
  unlockCount: number;
  unlockCostCredits: number;
  commission: number;
  createdAt: Date;
  updatedAt: Date;
};

export function buildListingsWhere(query: AdminListingsQuery): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {};

  if (query.includeDeleted !== 'true') {
    where.isDeleted = false;
  }

  if (query.status) {
    where.status = query.status as unknown as ListingStatus;
  }

  if (query.search) {
    where.OR = [
      { county: { contains: query.search, mode: 'insensitive' } },
      { neighborhood: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function buildListingUpdateData(
  input: AdminUpdateListingRequest,
): Prisma.ListingUpdateInput {
  const { availableFrom, availableTo, houseType, ...rest } = input;
  const data: Prisma.ListingUpdateInput = { ...rest };

  if (houseType !== undefined) {
    data.houseType = houseType as unknown as ListingHouseType;
  }

  if (availableFrom !== undefined) {
    data.availableFrom = new Date(availableFrom);
  }

  if (availableTo !== undefined) {
    data.availableTo = availableTo === null ? null : new Date(availableTo);
  }

  return data;
}

export function toListingSummary(listing: ListingRow): AdminListingSummary {
  return {
    id: listing.id,
    owner: {
      id: listing.user.id,
      firstName: listing.user.firstName,
      lastName: listing.user.lastName,
    },
    county: listing.county,
    neighborhood: listing.neighborhood,
    monthlyRent: listing.monthlyRent,
    houseType: listing.houseType as unknown as ContractHouseType,
    status: listing.status as unknown as ContractListingStatus,
    isApproved: listing.isApproved,
    isDeleted: listing.isDeleted,
    viewCount: listing.viewCount,
    unlockCount: listing.unlockCount,
    unlockCostCredits: listing.unlockCostCredits,
    commission: listing.commission,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}
