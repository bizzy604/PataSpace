import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import {
  Image,
  ImageBackground,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  countyOptions,
  createListingSteps,
  draftCameraSequence,
  estimateListingPricing,
  formatListingHouseType,
  houseTypeOptions,
  photoCapturePrompts,
} from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  coordinateLabel,
  isFreshFix,
  isWeakGpsFix,
  pickAddressLabel,
} from '@/lib/capture-location';
import { appRoutes } from '@/lib/routes';

type NativeUnimoduleProxy = {
  NativeUnimoduleProxy?: {
    viewManagersMetadata?: Record<string, unknown>;
  };
};

type ExpoGlobal = typeof globalThis & {
  expo?: {
    getViewConfig?: (
      moduleName: string,
      viewName?: string,
    ) =>
      | {
          validAttributes?: Record<string, unknown>;
          directEventTypes?: Record<string, unknown>;
        }
      | null
      | undefined;
  };
};

function hasExpoCameraViewManager() {
  if (Platform.OS === 'web') {
    return true;
  }

  const expoCameraMetadata = (NativeModules as NativeUnimoduleProxy).NativeUnimoduleProxy
    ?.viewManagersMetadata?.ExpoCamera;
  const expoCameraViewConfig = (globalThis as ExpoGlobal).expo?.getViewConfig?.('ExpoCamera');

  return Boolean(expoCameraMetadata && expoCameraViewConfig);
}

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

function ChoiceField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              className={[
                'rounded-full border px-4 py-3',
                isSelected ? 'border-transparent bg-primary' : 'border-border bg-secondary',
              ].join(' ')}
              onPress={() => onChange(option.value)}
            >
              <Text
                className={[
                  'text-sm font-semibold',
                  isSelected ? 'text-primary-foreground' : 'text-foreground',
                ].join(' ')}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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

async function resolveAddressLabel(position: Location.LocationObject) {
  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    return pickAddressLabel([address?.district, address?.street, address?.city]);
  } catch {
    return null;
  }
}

export function CreateListingScreen() {
  const cameraViewManagerAvailable = hasExpoCameraViewManager();
  const cameraRef = useRef<CameraView | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestFixRef = useRef<Location.LocationObject | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const { draft, addDraftPhoto, updateDraft, updateDraftPhoto } = useMobileApp();
  const nextPrompt = photoCapturePrompts[draft.photos.length] ?? `Extra angle ${draft.photos.length + 1}`;

  useEffect(() => {
    return () => {
      if (isRecording) cameraRef.current?.stopRecording();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;

    async function syncPermissions() {
      if (!cameraViewManagerAvailable) {
        setCaptureError(
          'Camera preview is unavailable in this Expo runtime. Update Expo Go, restart Metro with a clean cache, or use a development build.',
        );
        return;
      }

      try {
        let [cameraPermission, locationPermission] = await Promise.all([
          Camera.getCameraPermissionsAsync(),
          Location.getForegroundPermissionsAsync(),
        ]);

        if (!cameraPermission.granted) {
          cameraPermission = await Camera.requestCameraPermissionsAsync();
        }

        if (!locationPermission.granted) {
          locationPermission = await Location.requestForegroundPermissionsAsync();
        }

        if (!active) {
          return;
        }

        setCameraPermissionGranted(cameraPermission.granted);
        setLocationPermissionGranted(locationPermission.granted);
      } catch {
        if (active) {
          setCaptureError('Permissions could not be checked.');
        }
      }
    }

    void syncPermissions();

    return () => {
      active = false;
    };
  }, []);

  // Keep a warm GPS fix while the screen is open so capture never waits on a
  // cold satellite lock. Best-effort: capture falls back to a live fix.
  useEffect(() => {
    if (!locationPermissionGranted) {
      return;
    }

    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 0 },
      (position) => {
        latestFixRef.current = position;
      },
    )
      .then((sub) => {
        if (active) {
          subscription = sub;
        } else {
          sub.remove();
        }
      })
      .catch(() => {
        // Warm-up only; handleCapture requests its own fix when this fails.
      });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [locationPermissionGranted]);

  async function ensurePermissions() {
    if (!cameraViewManagerAvailable) {
      setCaptureError(
        'Camera preview is unavailable in this Expo runtime. Update Expo Go, restart Metro with a clean cache, or use a development build.',
      );
      return false;
    }

    let hasCamera = cameraPermissionGranted ?? false;
    let hasLocation = locationPermissionGranted ?? false;

    if (!hasCamera) {
      const result = await Camera.requestCameraPermissionsAsync();
      hasCamera = result.granted;
      setCameraPermissionGranted(result.granted);
    }

    if (!hasLocation) {
      const result = await Location.requestForegroundPermissionsAsync();
      hasLocation = result.granted;
      setLocationPermissionGranted(result.granted);
    }

    if (!hasCamera || !hasLocation) {
      setCaptureError('Camera and GPS permissions are required.');
      return false;
    }

    return true;
  }

  async function resolveCapturePosition() {
    const warmFix = latestFixRef.current;

    if (warmFix && isFreshFix(warmFix.timestamp, Date.now())) {
      return warmFix;
    }

    return Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: true,
    });
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
      // Shutter and GPS fix run in parallel; the warm watcher fix usually
      // makes the position side instant.
      const [photo, position] = await Promise.all([
        cameraRef.current.takePictureAsync({
          quality: 0.72,
          shutterSound: false,
        }),
        resolveCapturePosition(),
      ]);

      if (!photo?.uri) {
        throw new Error('Missing photo URI');
      }

      const weakGpsFix = isWeakGpsFix({
        mocked: position.mocked,
        accuracyMeters: position.coords.accuracy,
      });
      const photoId = `draft-photo-${Date.now()}`;

      addDraftPhoto({
        id: photoId,
        label: nextPrompt,
        quality: weakGpsFix ? 'Retake' : 'Strong',
        source: { uri: photo.uri },
        capturedAt: new Date(position.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        locationLabel: coordinateLabel(position.coords.latitude, position.coords.longitude),
        gps: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          mocked: position.mocked,
          timestamp: position.timestamp,
        },
      });

      // Reverse geocoding is a network round trip; patch the label in the
      // background instead of blocking the shutter on it.
      void resolveAddressLabel(position).then((label) => {
        if (label) {
          updateDraftPhoto(photoId, { locationLabel: label });
        }
      });
    } catch {
      setCaptureError('Capture failed. Try again.');
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleStartRecording() {
    if (!cameraRef.current || isRecording || !cameraReady) return;
    setCaptureError('');
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: 30,
        maxFileSize: 10 * 1024 * 1024,
      });
      if (result?.uri) {
        updateDraft({ video: { uri: result.uri } });
      } else {
        setCaptureError('Recording did not produce a video. Try again.');
      }
    } catch (error) {
      // Never swallow this: a rejected recordAsync (missing permission,
      // camera session error) previously failed with no feedback at all.
      setCaptureError(
        error instanceof Error && error.message
          ? `Recording failed: ${error.message}`
          : 'Recording failed. Try again.',
      );
    } finally {
      setIsRecording(false);
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    }
  }

  function handleStopRecording() {
    cameraRef.current?.stopRecording();
  }

  const previewStrip = draft.photos.slice(-3).reverse();
  const canRenderLiveCamera = cameraViewManagerAvailable && cameraPermissionGranted;
  const recordingLabel = isRecording
    ? `Stop  ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}`
    : draft.video?.uri ? 'Re-record walkthrough' : 'Record walkthrough (optional)';
  const captureLabel = !cameraViewManagerAvailable
    ? 'Camera unavailable in this build'
    : isCapturing
      ? 'Saving...'
      : `Capture ${nextPrompt}`;

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          {cameraMode === 'picture' ? (
            <Button
              disabled={isCapturing || !cameraReady || !cameraViewManagerAvailable}
              label={captureLabel}
              onPress={() => void handleCapture()}
            />
          ) : (
            <Button
              disabled={!cameraReady || !cameraViewManagerAvailable}
              variant={isRecording ? 'dark' : 'default'}
              label={recordingLabel}
              onPress={isRecording ? handleStopRecording : () => void handleStartRecording()}
            />
          )}
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              variant="outline"
              label={cameraMode === 'picture' ? '🎥 Video' : '📷 Photos'}
              onPress={() => { if (!isRecording) setCameraMode((m) => m === 'picture' ? 'video' : 'picture'); }}
            />
            <Link href={appRoutes.createListingPhotos} asChild>
              <Button className="flex-1" variant="outline" label={`Review ${draft.photos.length}`} />
            </Link>
          </View>
        </View>
      }
    >
      <SectionHeader kicker="Post listing" title="Camera" description="Live capture with GPS" />

      {canRenderLiveCamera ? (
        <View className="h-[420px] overflow-hidden rounded-[32px] bg-surface-inverse shadow-floating">
          <CameraView
            ref={cameraRef}
            facing="back"
            mode={cameraMode}
            videoQuality="480p"
            // Muted on purpose: the build strips RECORD_AUDIO from the
            // Android manifest (recordAudioAndroid: false in app.config.ts),
            // and expo-camera rejects unmuted recording without it.
            mute
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
              {cameraMode === 'video' ? (
                <>
                  <Text className="text-[32px] font-semibold tracking-[-0.8px] text-white">
                    {isRecording ? `Recording ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}` : 'Walkthrough video'}
                  </Text>
                  <Text className="text-sm text-white/75">Max 30 seconds · 10MB · 480p · no audio</Text>
                </>
              ) : (
                <>
                  <Text className="text-[32px] font-semibold tracking-[-0.8px] text-white">{nextPrompt}</Text>
                  <Text className="text-sm text-white/75">
                    {locationPermissionGranted ? 'GPS ready' : 'Enable GPS to capture'}
                  </Text>
                </>
              )}
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
              {cameraViewManagerAvailable ? 'Camera permission needed' : 'Camera preview unavailable'}
            </Text>
            {cameraViewManagerAvailable ? (
              <Button
                label="Enable camera and GPS"
                onPress={() => {
                  void ensurePermissions();
                }}
              />
            ) : (
              <Text className="text-sm text-white/80">
                Install a fresh development build or reopen the app in a runtime with camera support.
              </Text>
            )}
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
          value={locationPermissionGranted ? 'Attached' : 'Required'}
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
  const { draft, removeDraftPhoto, updateDraft } = useMobileApp();

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

      <Card>
        <CardTitle className="text-xl">Video walkthrough</CardTitle>
        {draft.video?.uri ? (
          <>
            <CardDescription>Walkthrough recorded · uploads with listing · max 10MB</CardDescription>
            <Button
              className="mt-4"
              variant="secondary"
              label="Remove video"
              onPress={() => updateDraft({ video: undefined })}
            />
          </>
        ) : (
          <CardDescription>
            Optional. Switch to video mode on the camera screen to record a short walkthrough (max 30s / 10MB, no audio).
          </CardDescription>
        )}
      </Card>
    </Screen>
  );
}

export function ListingDetailsFormScreen() {
  const { draft, updateDraft } = useMobileApp();
  const countyChoices = countyOptions.map((county) => ({
    label: county,
    value: county,
  }));

  return (
    <Screen
      bottomBar={
        <Link href={appRoutes.createListingReview} asChild>
          <Button label="Review" />
        </Link>
      }
    >
      <SectionHeader
        kicker="Post listing"
        title="Details"
        description="County, house type, rent, move date, contact"
      />

      <Card className="gap-5">
        <Field
          label="Title"
          value={draft.title}
          onChangeText={(value) => updateDraft({ title: value })}
          placeholder="Sunny 1BR near Ngong Road"
        />
        <ChoiceField
          label="County"
          value={draft.county}
          options={countyChoices}
          onChange={(value) => updateDraft({ county: value })}
        />
        <ChoiceField
          label="House type"
          value={draft.houseType}
          options={houseTypeOptions}
          onChange={(value) => updateDraft({ houseType: value })}
        />
        <Field
          label="Neighborhood"
          value={draft.area}
          onChangeText={(value) => updateDraft({ area: value })}
          placeholder="Kilimani"
        />
        <Field
          label="Location / address"
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
  const { draft, submitDraft, updateDraft } = useMobileApp();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const monthlyRent = Number(draft.monthlyRent) || 0;
  const pricing = estimateListingPricing(draft.houseType, monthlyRent);
  const heroPhoto = draft.photos[0];

  return (
    <Screen
      bottomBar={
        <Button
          disabled={draft.photos.length === 0 || !draft.landlordAware || isSubmitting}
          label={
            draft.photos.length === 0
              ? 'Capture a photo first'
              : !draft.landlordAware
                ? 'Confirm the landlord knows first'
                : isSubmitting
                  ? 'Uploading photos…'
                  : 'Submit listing'
          }
          onPress={async () => {
            setSubmitError('');
            setIsSubmitting(true);
            try {
              await submitDraft();
              router.replace(appRoutes.listingSubmitted);
            } catch (err) {
              setSubmitError(err instanceof Error ? err.message : 'Upload failed. Check your connection and try again.');
              setIsSubmitting(false);
            }
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
            <Text className="text-sm text-white/75">
              {heroPhoto.locationLabel ?? `${draft.area}, ${draft.county}`}
            </Text>
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
            {pricing.unlockCredits.toLocaleString()} credits
          </Text>
        </Card>
      </View>

      <Card>
        <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
          You earn on confirmed move-in
        </Text>
        <Text className="mt-2 text-[24px] font-semibold text-foreground">
          KES {pricing.posterEarningsKes.toLocaleString()}
        </Text>
        <CardDescription>
          70% of the KES {pricing.successFeeKes.toLocaleString()} success fee the mover pays only
          when they move in.
        </CardDescription>
      </Card>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.landlordAware }}
        onPress={() => updateDraft({ landlordAware: !draft.landlordAware })}
      >
        <Card className={draft.landlordAware ? 'border border-primary' : ''}>
          <View className="flex-row items-center gap-3">
            <AppIcon
              active={draft.landlordAware}
              name={draft.landlordAware ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
            />
            <View className="flex-1">
              <CardTitle className="text-[16px]">
                The landlord or caretaker knows this unit is being listed
              </CardTitle>
              <CardDescription>
                Required. Talking to them first prevents declined move-ins later.
              </CardDescription>
            </View>
          </View>
        </Card>
      </Pressable>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">County</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">{draft.county}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">House type</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">
            {formatListingHouseType(draft.houseType)}
          </Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-[20px]">Summary</CardTitle>
        <CardDescription>
          {draft.photos.length} photos | {draft.area}, {draft.county} | {draft.availableFrom}
        </CardDescription>
        <Text className="mt-2 text-sm text-muted-foreground">
          {formatListingHouseType(draft.houseType)} | {draft.landlordPhone}
        </Text>
      </Card>

      {submitError ? (
        <Card>
          <Text className="text-sm font-semibold text-primary">{submitError}</Text>
        </Card>
      ) : null}
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
