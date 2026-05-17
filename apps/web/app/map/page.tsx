import type { ListingCard } from '@pataspace/contracts';
import { MapViewPage } from '@/components/discovery/page';
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

  const response = await getListings(query ? { neighborhood: query } : {}, 1, 24).catch(() => ({
    data: [] as ListingCard[],
    pagination: EMPTY_PAGINATION,
  }));

  return <MapViewPage query={query} listings={response.data} />;
}
