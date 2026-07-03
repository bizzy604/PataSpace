/**
 * Purpose: Pure GPS validation helpers for listing capture integrity: photo
 * coordinates must sit within 100m of the claimed listing location.
 * Why important: capture-time GPS is the anti-fraud anchor for supply; a
 * listing whose media was shot elsewhere is the primary fake-listing vector.
 * Used by: ListingService (create/update/approve validation paths).
 */
import { BadRequestException } from '@nestjs/common';

export const GPS_MATCH_THRESHOLD_METERS = 100;

export function calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(latitude2 - latitude1);
  const longitudeDelta = toRadians(longitude2 - longitude1);
  const latitude1Radians = toRadians(latitude1);
  const latitude2Radians = toRadians(latitude2);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitude1Radians) *
      Math.cos(latitude2Radians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

export function assertPhotoGpsMatchesListing(
  listingLatitude: number,
  listingLongitude: number,
  photos: Array<{ latitude: number; longitude: number; s3Key: string }>,
) {
  photos.forEach((photo) => {
    assertWithinThreshold(
      listingLatitude,
      listingLongitude,
      photo.latitude,
      photo.longitude,
      photo.s3Key,
    );
  });
}

export function assertStoredPhotoGpsMatchesListing(
  listingLatitude: number,
  listingLongitude: number,
  photos: Array<{ latitude: number | null; longitude: number | null; s3Key: string }>,
) {
  photos.forEach((photo) => {
    if (photo.latitude === null || photo.longitude === null) {
      throw new BadRequestException({
        code: 'GPS_MISMATCH',
        message: 'All listing photos must include GPS metadata before approval',
        details: {
          s3Key: photo.s3Key,
        },
      });
    }

    assertWithinThreshold(
      listingLatitude,
      listingLongitude,
      photo.latitude,
      photo.longitude,
      photo.s3Key,
    );
  });
}

function assertWithinThreshold(
  listingLatitude: number,
  listingLongitude: number,
  photoLatitude: number,
  photoLongitude: number,
  s3Key: string,
) {
  const distanceMeters = calculateDistanceMeters(
    listingLatitude,
    listingLongitude,
    photoLatitude,
    photoLongitude,
  );

  if (distanceMeters <= GPS_MATCH_THRESHOLD_METERS) {
    return;
  }

  throw new BadRequestException({
    code: 'GPS_MISMATCH',
    message: 'Photo GPS coordinates must match the listing coordinates within 100 meters',
    details: {
      distanceMeters: Math.round(distanceMeters),
      s3Key,
    },
  });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
