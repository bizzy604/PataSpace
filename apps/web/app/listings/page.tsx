import { ListingCard } from '../../components/listings/listing-card';

const sampleListings = [
  {
    id: 'listing-1',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    bedrooms: 2,
    unlockCostCredits: 2500,
  },
];

export default function ListingsPage() {
  return (
    <section style={{ padding: '2rem 1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <h1>Listings</h1>
      {sampleListings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </section>
  );
}
