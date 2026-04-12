import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const easProjectId = '174b5ff9-37ae-4ba1-a311-d552dbc9ae96';

const config: ExpoConfig = {
  name: 'PataSpace',
  slug: 'pataspace',
  owner: 'amoni1234',
  scheme: 'pataspace',
  version: '1.0.0',
  icon: './assets/PataSpace Logo.png',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  experiments: {
    typedRoutes: true,
    autolinkingModuleResolution: true,
  },
  extra: {
    eas: {
      projectId: easProjectId,
    },
  },
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow PataSpace to capture listing photos.',
        microphonePermission: 'Allow PataSpace to record listing videos.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow PataSpace to attach GPS to listing photos.',
      },
    ],
  ],
  ios: {
    bundleIdentifier: 'com.pataspace.mobile',
    buildNumber: '1',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.pataspace.mobile',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/PataSpace Logo.png',
      backgroundColor: '#FFFFFF',
    },
    ...(googleMapsApiKey
      ? {
          config: {
            googleMaps: {
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {}),
  },
  splash: {
    image: './assets/PataSpace Logo.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
};

export default config;
