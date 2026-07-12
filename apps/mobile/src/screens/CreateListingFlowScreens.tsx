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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  countyOptions,
  draftCameraSequence,
  houseTypeOptions,
  photoCapturePrompts,
} from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  coordinateLabel,
  isFreshFix,
  isWeakGpsFix,
  pickAddressLabel,
} from '@/lib/capture-location';
import {
  AMENITY_PRESETS,
  hasAmenity,
  toggleAmenity,
} from '@/lib/listings/amenities-field';
import {
  MAX_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS,
  captureMoreLabel,
  hasEnoughPhotos,
} from '@/lib/listing-rules';
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
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: ComponentProps<typeof Input>['keyboardType'];
}) {
  return (
    <Input
      label={label}
      className={multiline ? 'min-h-28 py-4' : undefined}
      multiline={multiline}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
    />
  );
}

/** Full-pill choice row (county, house type) using the shared Chip. */
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
    <View className="gap-2">
      <Text className="font-body-bold text-label-md text-muted-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
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
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const router = useRouter();
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

  const canRenderLiveCamera = cameraViewManagerAvailable && cameraPermissionGranted;
  const lastCapture = draft.photos[draft.photos.length - 1];
  const recordingClock = `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}`;
  const flashIcon =
    flashMode === 'on' ? 'flash' : flashMode === 'off' ? 'flash-off-outline' : 'flash-outline';

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Top bar: close, title, flash */}
      <SafeAreaView edges={['top']} className="bg-black/90">
        <View className="flex-row items-center justify-between px-3 py-2">
          <Pressable
            className="h-11 w-11 items-center justify-center active:opacity-70"
            onPress={() => router.back()}
            accessibilityLabel="Close camera"
          >
            <AppIcon name="close" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="font-display text-headline-sm text-white">Take Photos</Text>
          <Pressable
            className="h-11 w-11 items-center justify-center active:opacity-70"
            onPress={() => setFlashMode((m) => (m === 'auto' ? 'on' : m === 'on' ? 'off' : 'auto'))}
            accessibilityLabel={`Flash ${flashMode}`}
          >
            <AppIcon name={flashIcon} size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <View className="flex-row gap-1 px-4 pb-2">
          <View className="h-1 flex-1 rounded-full bg-primary" />
          <View className="h-1 flex-1 rounded-full bg-white/20" />
          <View className="h-1 flex-1 rounded-full bg-white/20" />
          <View className="h-1 flex-1 rounded-full bg-white/20" />
        </View>
      </SafeAreaView>

      {/* Camera preview */}
      <View className="flex-1">
        {canRenderLiveCamera ? (
          <>
            <CameraView
              ref={cameraRef}
              facing={facing}
              mode={cameraMode}
              flash={flashMode}
              videoQuality="480p"
              // Muted on purpose: the build strips RECORD_AUDIO from the
              // Android manifest (recordAudioAndroid: false in app.config.ts),
              // and expo-camera rejects unmuted recording without it.
              mute
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => setCaptureError('Camera preview failed to load.')}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <View className="absolute inset-y-0 w-px bg-white/20" style={{ left: '33.33%' }} />
              <View className="absolute inset-y-0 w-px bg-white/20" style={{ left: '66.66%' }} />
              <View className="absolute inset-x-0 h-px bg-white/20" style={{ top: '33.33%' }} />
              <View className="absolute inset-x-0 h-px bg-white/20" style={{ top: '66.66%' }} />
              <View
                className="absolute rounded-[8px] border border-white/60"
                style={{ left: '12%', right: '12%', top: '28%', bottom: '28%' }}
              />
            </View>
          </>
        ) : (
          <ImageBackground
            className="flex-1 justify-end p-6"
            source={draftCameraSequence[0].source}
          >
            <View className="absolute inset-0 bg-black/60" />
            <View className="gap-3">
              <Text className="font-display text-headline-md text-white">
                {cameraViewManagerAvailable ? 'Camera permission needed' : 'Camera preview unavailable'}
              </Text>
              {cameraViewManagerAvailable ? (
                <Button label="Enable camera and GPS" onPress={() => void ensurePermissions()} />
              ) : (
                <Text className="font-body text-body-md text-white/80">
                  Install a fresh development build or reopen the app in a runtime with camera support.
                </Text>
              )}
            </View>
          </ImageBackground>
        )}
      </View>

      {/* Bottom controls */}
      <SafeAreaView edges={['bottom']} className="bg-black/90">
        <View className="gap-4 px-5 pb-2 pt-4">
          {captureError ? (
            <Text className="text-center font-body text-body-md text-danger">{captureError}</Text>
          ) : null}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <AppIcon
                name="location"
                size={14}
                color={locationPermissionGranted ? '#34C759' : '#FF3B30'}
              />
              <Text className="font-body-medium text-label-md text-white">
                {locationPermissionGranted ? 'GPS Active' : 'GPS off'}
              </Text>
            </View>
            <View className="rounded-full bg-white/10 px-3 py-1.5">
              <Text className="font-body-medium text-label-md text-white">
                {cameraMode === 'video'
                  ? isRecording
                    ? `● ${recordingClock}`
                    : 'Max 30s video'
                  : `${draft.photos.length}/${MAX_LISTING_PHOTOS} photos`}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-center gap-6">
            <Pressable
              onPress={() => {
                if (!isRecording) setCameraMode('picture');
              }}
              accessibilityLabel="Photo mode"
            >
              <Text
                className={
                  cameraMode === 'picture'
                    ? 'font-display text-body-md text-white'
                    : 'font-body-medium text-body-md text-white/50'
                }
              >
                Photo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCameraMode('video')}
              accessibilityLabel="Video mode"
            >
              <Text
                className={
                  cameraMode === 'video'
                    ? 'font-display text-body-md text-white'
                    : 'font-body-medium text-body-md text-white/50'
                }
              >
                Video
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between">
            {lastCapture ? (
              <Link href={appRoutes.createListingPhotos} asChild>
                <Pressable
                  className="h-14 w-14 overflow-hidden rounded-[12px] border border-white/40 active:opacity-80"
                  accessibilityLabel={`Review ${draft.photos.length} photos`}
                >
                  <Image className="h-full w-full" source={lastCapture.source} />
                </Pressable>
              </Link>
            ) : (
              <View className="h-14 w-14 rounded-[12px] border border-white/20" />
            )}

            {cameraMode === 'picture' ? (
              <Pressable
                disabled={isCapturing || !cameraReady || !cameraViewManagerAvailable}
                onPress={() => void handleCapture()}
                accessibilityLabel="Capture photo"
                className="h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-white/70 active:opacity-80"
                style={{ opacity: isCapturing || !cameraReady || !cameraViewManagerAvailable ? 0.5 : 1 }}
              >
                <View className="h-[58px] w-[58px] rounded-full bg-white" />
              </Pressable>
            ) : (
              <Pressable
                disabled={!cameraReady || !cameraViewManagerAvailable}
                onPress={isRecording ? handleStopRecording : () => void handleStartRecording()}
                accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
                className="h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-white/70 active:opacity-80"
                style={{ opacity: !cameraReady || !cameraViewManagerAvailable ? 0.5 : 1 }}
              >
                {isRecording ? (
                  <View className="h-7 w-7 rounded-[6px] bg-danger" />
                ) : (
                  <View className="h-[58px] w-[58px] rounded-full bg-danger" />
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              accessibilityLabel="Flip camera"
              className="h-14 w-14 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              <AppIcon name="camera-reverse-outline" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function PhotoReviewScreen() {
  const { draft, removeDraftPhoto, updateDraft } = useMobileApp();
  const router = useRouter();
  const enough = hasEnoughPhotos(draft.photos.length);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Review Photos"
          right={
            <Pressable
              disabled={!enough}
              onPress={() => router.push(appRoutes.createListingDetails)}
              accessibilityLabel="Next"
              className="active:opacity-70"
            >
              <Text
                className={
                  enough
                    ? 'font-body-medium text-body-md text-primary-container'
                    : 'font-body-medium text-body-md text-white/40'
                }
              >
                Next
              </Text>
            </Pressable>
          }
        />
      }
      bottomBar={
        enough ? (
          <Link href={appRoutes.createListingDetails} asChild>
            <Button shape="pill" label="Continue to Details" />
          </Link>
        ) : (
          <Button shape="pill" disabled label={captureMoreLabel(draft.photos.length)} />
        )
      }
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-display text-headline-md text-foreground">Listing Photos</Text>
          <Text className="mt-1 font-body text-body-md text-muted-foreground">
            The first photo is your cover. At least {MIN_LISTING_PHOTOS} required.
          </Text>
        </View>
        <View className="rounded-full bg-surface-subtle px-3 py-1">
          <Text className="font-body-medium text-label-md text-muted-foreground">
            {draft.photos.length}/{MAX_LISTING_PHOTOS}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {draft.photos.map((photo, index) => (
          <View
            key={photo.id}
            className="aspect-square w-[31%] overflow-hidden rounded-[12px] bg-surface-subtle"
          >
            <Image className="h-full w-full" source={photo.source} />
            {index === 0 ? (
              <View className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5">
                <Text className="font-body-medium text-caption text-primary-foreground">COVER</Text>
              </View>
            ) : null}
            <Pressable
              className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-black/60 active:opacity-80"
              onPress={() => removeDraftPhoto(photo.id)}
              accessibilityLabel={`Remove photo ${index + 1}`}
            >
              <AppIcon name="close" size={14} color="#FFFFFF" />
            </Pressable>
            {photo.gps ? (
              <View className="absolute bottom-1.5 left-1.5 flex-row items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5">
                <AppIcon name="location" size={10} color="#FFFFFF" />
                <Text className="font-body text-caption text-white">
                  {photo.gps.mocked ? 'Check' : 'Geo'}
                </Text>
              </View>
            ) : null}
          </View>
        ))}

        <Link href={appRoutes.createListing} asChild>
          <Pressable className="aspect-square w-[31%] items-center justify-center gap-1 rounded-[12px] border border-dashed border-outline active:opacity-70">
            <AppIcon name="camera" size={26} active />
            <Text className="font-body-medium text-label-md text-primary">Add More</Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-row items-start gap-3 rounded-[16px] bg-card p-4 shadow-card">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <AppIcon name="videocam" size={20} active />
        </View>
        <View className="flex-1">
          <Text className="font-display text-body-lg text-foreground">
            Property Video <Text className="font-body text-body-md text-muted-foreground">(Optional)</Text>
          </Text>
          <Text className="mt-1 font-body text-body-md text-muted-foreground">
            Record a short walk-through to attract more buyers. 30 second max, no audio.
          </Text>
          {draft.video?.uri ? (
            <View className="mt-3 flex-row items-center gap-2">
              <AppIcon name="checkmark-circle" size={18} color="#34C759" />
              <Text className="flex-1 font-body-medium text-body-md text-foreground">Walkthrough recorded</Text>
              <Pressable onPress={() => updateDraft({ video: undefined })} className="active:opacity-70">
                <Text className="font-body-medium text-body-md text-danger">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Link href={appRoutes.createListing} asChild>
              <Button className="mt-3 self-start" size="sm" variant="outline" label="Record Video" />
            </Link>
          )}
        </View>
      </View>
    </Screen>
  );
}

export function ListingDetailsFormScreen() {
  const { draft, updateDraft } = useMobileApp();
  const router = useRouter();
  const countyChoices = countyOptions.map((county) => ({ label: county, value: county }));
  const descriptionLength = draft.description.length;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Property Details"
          right={
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Save and go back"
              className="active:opacity-70"
            >
              <Text className="font-body-medium text-body-md text-primary-container">Save</Text>
            </Pressable>
          }
        />
      }
      bottomBar={
        <Link href={appRoutes.createListingReview} asChild>
          <Button shape="pill" label="Continue" />
        </Link>
      }
    >
      <ProgressSteps count={3} current={1} label="Post a listing" />

      <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Basic Info</Text>
        <Field
          label="Title"
          value={draft.title}
          onChangeText={(value) => updateDraft({ title: value })}
          placeholder="Sunny 1BR near Ngong Road"
        />
        <Field
          label="Monthly Rent (KES)"
          value={draft.monthlyRent}
          onChangeText={(value) => updateDraft({ monthlyRent: value })}
          placeholder="22000"
          keyboardType="number-pad"
        />
        <Field
          label="Deposit (KES)"
          value={draft.deposit}
          onChangeText={(value) => updateDraft({ deposit: value })}
          placeholder="22000"
          keyboardType="number-pad"
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
        <ChoiceField
          label="County"
          value={draft.county}
          options={countyChoices}
          onChange={(value) => updateDraft({ county: value })}
        />
        <View className="flex-row items-center gap-2">
          <AppIcon name="checkmark-circle" size={18} color="#34C759" />
          <Text className="font-body-medium text-body-md text-foreground">GPS Verified Location</Text>
          <Text className="font-body text-label-md text-muted-foreground">· from your photos</Text>
        </View>
      </View>

      <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Property Type</Text>
        <ChoiceField
          label="Type & size"
          value={draft.houseType}
          options={houseTypeOptions}
          onChange={(value) => updateDraft({ houseType: value })}
        />
      </View>

      <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Amenities</Text>
        <View className="flex-row flex-wrap gap-2">
          {AMENITY_PRESETS.map((amenity) => (
            <Chip
              key={amenity}
              label={amenity}
              active={hasAmenity(draft.amenities, amenity)}
              onPress={() => updateDraft({ amenities: toggleAmenity(draft.amenities, amenity) })}
            />
          ))}
        </View>
        <Field
          label="Other amenities"
          value={draft.amenities}
          onChangeText={(value) => updateDraft({ amenities: value })}
          placeholder="Parking, water backup, caretaker"
        />
      </View>

      <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Description</Text>
        <Field
          label="About the home"
          value={draft.description}
          onChangeText={(value) => updateDraft({ description: value.slice(0, 500) })}
          placeholder="Describe the property, neighborhood vibes, rules…"
          multiline
        />
        <Text className="text-right font-body text-label-md text-muted-foreground">
          {descriptionLength}/500
        </Text>
      </View>

      <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Availability & Contact</Text>
        <Field
          label="Available from"
          value={draft.availableFrom}
          onChangeText={(value) => updateDraft({ availableFrom: value })}
          placeholder="April 15, 2026"
        />
        <Field
          label="Landlord / caretaker contact"
          value={draft.landlordPhone}
          onChangeText={(value) => updateDraft({ landlordPhone: value })}
          placeholder="+254 711 020 304"
          keyboardType="phone-pad"
        />
        <Field
          label="Move reason"
          value={draft.moveReason}
          onChangeText={(value) => updateDraft({ moveReason: value })}
          placeholder="Relocating closer to work"
        />
      </View>
    </Screen>
  );
}

export function ListingSubmittedScreen() {
  const { latestSubmittedListing } = useMobileApp();

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <Link href={appRoutes.myListings} asChild>
            <Button shape="pill" label="Open My Listings" />
          </Link>
          <Link href={appRoutes.createListing} asChild>
            <Button shape="pill" variant="outline" label="Post Another" />
          </Link>
        </View>
      }
    >
      <View className="items-center gap-6 pt-10">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-primary shadow-floating">
          <AppIcon name="checkmark" size={56} inverse />
        </View>
        <View className="items-center gap-2">
          <Text className="text-center font-display text-display-02 text-foreground">
            Listing Submitted!
          </Text>
          <Text className="px-6 text-center font-body text-body-lg text-muted-foreground">
            Your listing is now in review. We usually approve within 24–48 hours.
          </Text>
        </View>
      </View>

      <View className="gap-1 rounded-[16px] bg-surface-subtle p-5">
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
          Submitted
        </Text>
        <Text className="font-display text-headline-sm text-foreground">
          {latestSubmittedListing?.title ?? 'Latest listing'}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <AppIcon name="time-outline" size={16} />
          <Text className="font-body text-body-md text-muted-foreground">
            {latestSubmittedListing?.status ?? 'Review'} · {latestSubmittedListing?.updated ?? 'Just now'}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
