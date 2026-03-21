import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { appleHIGNativeTheme } from '@pataspace/design-tokens';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background" style={appleHIGNativeTheme.screen}>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaView>
  );
}
