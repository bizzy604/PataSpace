import { Text, View } from 'react-native';

export function HomeScreen() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>PataSpace Mobile</Text>
      <Text style={{ marginTop: 12 }}>
        Listing creation, GPS capture, uploads, and tenant workflows start here.
      </Text>
    </View>
  );
}
