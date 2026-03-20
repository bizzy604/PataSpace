type ListingCardProps = {
  listing: {
    id: string;
    neighborhood: string;
    monthlyRent: number;
    bedrooms: number;
    unlockCostCredits: number;
  };
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article
      style={{
        padding: '1rem',
        border: '1px solid #ddd4c3',
        borderRadius: 12,
        background: '#ffffff',
        marginTop: '1rem',
      }}
    >
      <h2 style={{ marginTop: 0 }}>{listing.neighborhood}</h2>
      <p>KES {listing.monthlyRent.toLocaleString()} / month</p>
      <p>{listing.bedrooms} bedroom(s)</p>
      <p>Unlock: {listing.unlockCostCredits.toLocaleString()} credits</p>
    </article>
  );
}
