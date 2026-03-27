import type { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

const config: ExpoConfig = {
  name: 'PataSpace',
  slug: 'pataspace',
  scheme: 'pataspace',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  experiments: {
    typedRoutes: true,
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  android: {
    package: 'com.pataspace.mobile',
    versionCode: 1,
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
};

export default config;
