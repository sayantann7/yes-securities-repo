import { Stack, SplashScreen } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { typography } from '@/constants/font';
import { useTrackAppTime } from '@/hooks/useTrackAppTime';

const customTextProps = {
  style: {
    fontWeight: '900',
    fontFamily: typography.primary,
    color: '#002EDC',
    textShadowColor: 'rgba(0, 46, 220, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5
  }
};

const originalRender = (Text as any).render;
(Text as any).render = function render(props: any) {
  const mergedProps = { ...props, style: [customTextProps.style, props.style] };
  return originalRender.apply(this, [mergedProps]);
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [typography.primary]: require('../assets/fonts/book-antiqua.ttf'),
  });
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useTrackAppTime();

  if (!fontsLoaded && !fontError) {
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