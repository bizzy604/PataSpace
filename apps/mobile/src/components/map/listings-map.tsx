import { Text, View } from 'react-native';
import type { ListingPreview } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

type ListingsMapProps = {
  listings: ListingPreview[];
  selectedListingId?: string;
  onSelectListing?: (listingId: string) => void;
};

export function ListingsMap({ listings }: ListingsMapProps) {
  return (
    <Card className="gap-4">
      <View className="gap-2">
        <CardTitle className="text-[20px]">Map view is native-only</CardTitle>
        <CardDescription>
          Open this route on iOS or Android to browse approximate listing pins on the real map.
        </CardDescription>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {listings.map((listing) => (
          <Badge key={listing.id} variant="secondary">
            {listing.area}
          </Badge>
        ))}
      </View>
      <Text className="text-sm text-muted-foreground">
        Exact listing coordinates still reveal only after unlock.
      </Text>
    </Card>
  );
}
