import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { createListingSteps, draftCameraSequence, photoCapturePrompts } from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <Input
        className={multiline ? 'min-h-28 py-4' : undefined}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  );
}

function MiniAction({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof AppIcon>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-[22px] bg-secondary p-4">
      <AppIcon name={icon} size={18} />
      <Text className="mt-4 text-xs uppercase tracking-[1.8px] text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-base font-semibold text-foreground">{value}</Text>
    </View>
  );
}

async function buildLocationLabel(position: Location.LocationObject) {
  const fallbackLabel = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;

  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const parts = [address?.district, address?.street, address?.city]
      .map((part) => part?.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      return parts.slice(0, 2).join(', ');
    }
  } catch {
    return fallbackLabel;
  }

  return fallbackLabel;
}

export function CreateListingScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const { draft, addDraftPhoto } = useMobileApp();
  const nextPrompt = photoCapturePrompts[draft.photos.length] ?? `Extra angle ${draft.photos.length + 1}`;

  useEffect(() => {
    if (!cameraPermission) {
      void requestCameraPermission();
    }

    if (!locationPermission) {
      void requestLocationPermission();
    }
  }, [cameraPermission, locationPermission, requestCameraPermission, requestLocationPermission]);

  async function ensurePermissions() {
    let hasCamera = cameraPermission?.granted ?? false;
    let hasLocation = locationPermission?.granted ?? false;

    if (!hasCamera) {
      const result = await requestCameraPermission();
      hasCamera = result.granted;
    }

    if (!hasLocation) {
      const result = await requestLocationPermission();
      hasLocation = result.granted;
    }

    if (!hasCamera || !hasLocation) {
      setCaptureError('Camera and GPS permissions are required.');
      return false;
    }

    return true;
  }

  async function handleCapture() {
    if (isCapturing) {
      return;
    }

    const ready = await ensurePermissions();

    if (!ready || !cameraRef.current) {
      return;
    }

    setCaptureError('');
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.72,
        shutterSound: false,
      });

      if (!photo?.uri) {
        throw new Error('Missing photo URI');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      const locationLabel = await buildLocationLabel(position);
      const weakGpsFix =
        position.mocked === true ||
        (position.coords.accuracy !== null && position.coords.accuracy > 50);

      addDraftPhoto({
        id: `draft-photo-${Date.now()}`,
        label: nextPrompt,
        quality: weakGpsFix ? 'Retake' : 'Strong',
        source: { uri: photo.uri },
        capturedAt: new Date(position.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        locationLabel,
        gps: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          mocked: position.mocked,
          timestamp: position.timestamp,
        },
      });
    } catch {
      setCaptureError('Capture failed. Try again.');
    } finally {
      setIsCapturing(false);
    }
  }

  const previewStrip = draft.photos.slice(-3).reverse();

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <Button
            disabled={isCapturing || !cameraReady}
            label={isCapturing ? 'Saving...' : `Capture ${nextPrompt}`}
            onPress={() => {
              void handleCapture();
            }}
          />
          <Link href={appRoutes.createListingPhotos} asChild>
            <Button variant="outline" label={`Review ${draft.photos.length} photos`} />
          </Link>
        </View>
      }
    >
      <SectionHeader kicker="Post listing" title="Camera" description="Live capture with GPS" />

      {cameraPermission?.granted ? (
        <View className="h-[420px] overflow-hidden rounded-[32px] bg-surface-inverse shadow-floating">
          <CameraView
            ref={cameraRef}
            facing="back"
            mode="picture"
            mute={false}
            onCameraReady={() => setCameraReady(true)}
            onMountError={() => setCaptureError('Camera preview failed to load.')}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="absolute inset-0 justify-between p-6" pointerEvents="none">
            <View className="flex-row items-center justify-between">
              <View className="rounded-full bg-black/40 px-4 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/80">
                  Next shot
                </Text>
              </View>
              <View className="rounded-full bg-primary px-4 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary-foreground">
                  {draft.photos.length} saved
                </Text>
              </View>
            </View>

            <View className="items-center justify-center">
              <View className="h-56 w-[78%] rounded-[28px] border border-white/70 bg-transparent" />
            </View>

            <View className="gap-2">
              <Text className="text-[32px] font-semibold tracking-[-0.8px] text-white">{nextPrompt}</Text>
              <Text className="text-sm text-white/75">
                {locationPermission?.granted ? 'GPS ready' : 'Enable GPS to capture'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <ImageBackground
          className="h-[420px] overflow-hidden rounded-[32px] bg-surface-inverse p-6 shadow-floating"
          imageStyle={{ borderRadius: 32 }}
          source={draftCameraSequence[0].source}
        >
          <View className="absolute inset-0 bg-black/30" />
          <View className="mt-auto gap-3">
            <Text className="text-[30px] font-semibold tracking-[-0.8px] text-white">
              Camera permission needed
            </Text>
            <Button
              label="Enable camera and GPS"
              onPress={() => {
                void ensurePermissions();
              }}
            />
          </View>
        </ImageBackground>
      )}

      {captureError ? (
        <Card>
          <Text className="text-sm font-semibold text-primary">{captureError}</Text>
        </Card>
      ) : null}

      <View className="flex-row gap-3">
        <MiniAction icon="camera-outline" label="Mode" value="Live camera" />
        <MiniAction
          icon="location-outline"
          label="GPS"
          value={locationPermission?.granted ? 'Attached' : 'Required'}
        />
      </View>

      {previewStrip.length > 0 ? (
        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
            Recent captures
          </Text>
          <View className="flex-row gap-3">
            {previewStrip.map((photo) => (
              <Image
                key={photo.id}
                className="h-24 flex-1 rounded-[20px] bg-secondary"
                source={photo.source}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-3">
        {createListingSteps.map((item) => (
          <Card key={item.step}>
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-tertiary-foreground">
              Step {item.step}
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">{item.title}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function PhotoReviewScreen() {
  const { draft, removeDraftPhoto } = useMobileApp();

  return (
    <Screen
      bottomBar={
        draft.photos.length > 0 ? (
          <Link href={appRoutes.createListingDetails} asChild>
            <Button variant="dark" label="Continue" />
          </Link>
        ) : (
          <Button disabled label="Capture a photo first" />
        )
      }
    >
      <SectionHeader kicker="Post listing" title="Photos" description="Review captures" />

      {draft.photos.length === 0 ? (
        <Card>
          <CardTitle className="text-[20px]">No photos yet</CardTitle>
          <CardDescription>Open the camera and start capturing the rooms.</CardDescription>
        </Card>
      ) : null}

      {draft.photos.map((photo, index) => (
        <Card key={photo.id} className="gap-4 p-4">
          <Image className="h-52 w-full rounded-[22px]" source={photo.source} />
          <View className="gap-1">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
              Shot {index + 1}
            </Text>
            <CardTitle className="text-[20px]">{photo.label}</CardTitle>
            <CardDescription>{photo.capturedAt ?? 'Captured now'}</CardDescription>
            <Text className="text-sm text-muted-foreground">
              {photo.locationLabel ?? 'GPS unavailable'}
            </Text>
            {photo.gps ? (
              <Text className="text-xs text-muted-foreground">
                {photo.gps.mocked
                  ? 'Mocked location flagged. Retake with a live fix.'
                  : photo.gps.accuracyMeters !== null &&
                      photo.gps.accuracyMeters !== undefined
                    ? `Approx. accuracy +/-${Math.round(photo.gps.accuracyMeters)}m`
                    : 'GPS accuracy unavailable'}
              </Text>
            ) : null}
          </View>
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              variant="secondary"
              label="Remove"
              onPress={() => removeDraftPhoto(photo.id)}
            />
            <Link href={appRoutes.createListing} asChild>
              <Button className="flex-1" variant="outline" label="Retake" />
            </Link>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

export function ListingDetailsFormScreen() {
  const { draft, updateDraft } = useMobileApp();

  return (
    <Screen
      bottomBar={
        <Link href={appRoutes.createListingReview} asChild>
          <Button label="Review" />
        </Link>
      }
    >
      <SectionHeader kicker="Post listing" title="Details" description="Rent, move date, contact" />

      <Card className="gap-5">
        <Field
          label="Title"
          value={draft.title}
          onChangeText={(value) => updateDraft({ title: value })}
          placeholder="Sunny 1BR near Ngong Road"
        />
        <Field
          label="Area"
          value={draft.area}
          onChangeText={(value) => updateDraft({ area: value })}
          placeholder="Kilimani"
        />
        <Field
          label="Location"
          value={draft.location}
          onChangeText={(value) => updateDraft({ location: value })}
          placeholder="Ngong Road, Nairobi"
        />
        <Field
          label="Monthly rent"
          value={draft.monthlyRent}
          onChangeText={(value) => updateDraft({ monthlyRent: value })}
          placeholder="22000"
        />
        <Field
          label="Deposit"
          value={draft.deposit}
          onChangeText={(value) => updateDraft({ deposit: value })}
          placeholder="22000"
        />
        <Field
          label="Available from"
          value={draft.availableFrom}
          onChangeText={(value) => updateDraft({ availableFrom: value })}
          placeholder="April 15, 2026"
        />
        <Field
          label="Landlord contact"
          value={draft.landlordPhone}
          onChangeText={(value) => updateDraft({ landlordPhone: value })}
          placeholder="+254 711 020 304"
        />
        <Field
          label="Move reason"
          value={draft.moveReason}
          onChangeText={(value) => updateDraft({ moveReason: value })}
          placeholder="Relocating closer to work"
        />
        <Field
          label="Amenities"
          value={draft.amenities}
          onChangeText={(value) => updateDraft({ amenities: value })}
          placeholder="Parking, water backup, caretaker"
          multiline
        />
        <Field
          label="Description"
          value={draft.description}
          onChangeText={(value) => updateDraft({ description: value })}
          placeholder="Describe the home honestly."
          multiline
        />
      </Card>
    </Screen>
  );
}

export function ListingReviewScreen() {
  const { draft, submitDraft } = useMobileApp();
  const router = useRouter();
  const monthlyRent = Number(draft.monthlyRent) || 0;
  const unlockEstimate = Math.round(monthlyRent * 0.1);
  const heroPhoto = draft.photos[0];

  return (
    <Screen
      bottomBar={
        <Button
          disabled={draft.photos.length === 0}
          label={draft.photos.length === 0 ? 'Capture a photo first' : 'Submit listing'}
          onPress={() => {
            submitDraft();
            router.replace(appRoutes.listingSubmitted);
          }}
        />
      }
    >
      <SectionHeader kicker="Post listing" title="Review" description="One last check" />

      {heroPhoto ? (
        <ImageBackground
          className="h-72 overflow-hidden rounded-[28px] bg-surface-inverse p-5 shadow-floating"
          imageStyle={{ borderRadius: 28 }}
          source={heroPhoto.source}
        >
          <View className="absolute inset-0 bg-black/24" />
          <View className="mt-auto gap-2">
            <Text className="text-[28px] font-semibold tracking-[-0.8px] text-white">{draft.title}</Text>
            <Text className="text-sm text-white/75">{heroPhoto.locationLabel ?? draft.location}</Text>
          </View>
        </ImageBackground>
      ) : (
        <Card>
          <CardTitle className="text-[20px]">No photo captured</CardTitle>
          <CardDescription>Capture at least one room with GPS before submitting.</CardDescription>
        </Card>
      )}

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Rent</Text>
          <Text className="mt-2 text-[24px] font-semibold text-foreground">
            KES {monthlyRent.toLocaleString()}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Unlock</Text>
          <Text className="mt-2 text-[24px] font-semibold text-foreground">
            {unlockEstimate.toLocaleString()} credits
          </Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-[20px]">Summary</CardTitle>
        <CardDescription>
          {draft.photos.length} photos | {draft.availableFrom} | {draft.landlordPhone}
        </CardDescription>
      </Card>
    </Screen>
  );
}

export function ListingSubmittedScreen() {
  const { latestSubmittedListing } = useMobileApp();

  return (
    <Screen>
      <SectionHeader kicker="Post listing" title="Submitted" description="Now on your dashboard" />

      <Card>
        <CardTitle className="text-[20px]">{latestSubmittedListing?.title ?? 'Latest listing'}</CardTitle>
        <CardDescription>
          {latestSubmittedListing?.status ?? 'Review'} | {latestSubmittedListing?.updated ?? 'Just now'}
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Link href={appRoutes.myListings} asChild>
          <Button label="Open my listings" />
        </Link>
        <Link href={appRoutes.createListing} asChild>
          <Button variant="outline" label="Post another" />
        </Link>
      </View>
    </Screen>
  );
}
