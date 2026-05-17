import type { ListingCard } from '@pataspace/contracts';
import { SearchPage } from '@/components/discovery/page';
import { getListings } from '@/lib/api/listings';

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

const EMPTY_PAGINATION = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const query = firstValue(params.q);
  const hasQuery = Boolean(query?.trim());

  let listings: ListingCard[] = [];

  if (hasQuery) {
    const response = await getListings({ neighborhood: query }, 1, 24).catch(() => ({
      data: [] as ListingCard[],
      pagination: EMPTY_PAGINATION,
    }));
    listings = response.data;
  }

  return <SearchPage query={query} listings={listings} />;
}
