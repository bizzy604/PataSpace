import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type RevealedLocationMapProps = {
  address: string;
  latitude: number;
  longitude: number;
  title: string;
};

export function RevealedLocationMap({
  address,
  latitude,
  longitude,
  title,
}: RevealedLocationMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsCompass
        showsScale
        style={StyleSheet.absoluteFillObject}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          description={address}
          title={title}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    overflow: 'hidden',
    borderRadius: 32,
  },
});
