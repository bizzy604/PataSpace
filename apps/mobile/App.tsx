import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-stone-950">
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaView>
  );
}
