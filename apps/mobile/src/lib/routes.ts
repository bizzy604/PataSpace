import type { Href } from 'expo-router';

export function listingHref(id: string): Href {
  return {
    pathname: '/listing',
    params: { id },
  };
}
