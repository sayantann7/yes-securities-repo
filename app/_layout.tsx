import { Stack, SplashScreen } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import { typography } from '@/constants/font';
// Global Text component override to apply Nexa font consistently
const customTextProps = {
  style: {
    fontFamily: typography.primary,
  }
};

const originalTextRender = (Text as any).render;
(Text as any).render = function render(props: any) {
  const mergedProps = { ...props, style: [customTextProps.style, props.style] };
  return originalTextRender.apply(this, [mergedProps]);
};

// Global TextInput component override to apply Nexa font consistently
const customTextInputProps = {
  style: {
    fontFamily: typography.primary,
  }
};

const originalTextInputRender = (TextInput as any).render;
(TextInput as any).render = function render(props: any) {
  const mergedProps = { ...props, style: [customTextInputProps.style, props.style] };
  return originalTextInputRender.apply(this, [mergedProps]);
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load custom Nexa fonts
  const [fontsLoaded] = useFonts({
    NexaExtraLight: require('../assets/fonts/nexa-extra-light.ttf'),
    NexaHeavy: require('../assets/fonts/nexa-heavy.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't render the app until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </Provider>
  );
}