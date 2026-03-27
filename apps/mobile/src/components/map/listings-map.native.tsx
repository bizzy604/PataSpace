import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { ListingPreview } from '@/data/mock-listings';

type ListingsMapProps = {
  listings: ListingPreview[];
  selectedListingId?: string;
  onSelectListing?: (listingId: string) => void;
};

const DEFAULT_REGION: Region = {
  latitude: -1.29,
  longitude: 36.82,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function buildOverviewRegion(listings: ListingPreview[]): Region {
  if (listings.length === 0) {
    return DEFAULT_REGION;
  }

  const coordinates = listings.map((listing) => listing.mapLocation);
  const latitudes = coordinates.map((coordinate) => coordinate.approxLatitude);
  const longitudes = coordinates.map((coordinate) => coordinate.approxLongitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max(0.05, (maxLatitude - minLatitude) * 1.8 || 0.05),
    longitudeDelta: Math.max(0.05, (maxLongitude - minLongitude) * 1.8 || 0.05),
  };
}

export function ListingsMap({
  listings,
  selectedListingId,
  onSelectListing,
}: ListingsMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const selectedListing =
    listings.find((listing) => listing.id === selectedListingId) ?? listings[0];

  useEffect(() => {
    if (!selectedListing) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: selectedListing.mapLocation.approxLatitude,
        longitude: selectedListing.mapLocation.approxLongitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      250,
    );
  }, [selectedListing]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialRegion={buildOverviewRegion(listings)}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsCompass
        showsScale
        style={StyleSheet.absoluteFillObject}
      >
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: listing.mapLocation.approxLatitude,
              longitude: listing.mapLocation.approxLongitude,
            }}
            description={`${listing.price} | ${listing.title}`}
            onPress={() => onSelectListing?.(listing.id)}
            title={listing.area}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 420,
    overflow: 'hidden',
    borderRadius: 32,
  },
});
