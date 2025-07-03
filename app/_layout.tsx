import { Stack, SplashScreen } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { typography } from '@/constants/font';
import { useTrackAppTime } from '@/hooks/useTrackAppTime';
import {
  useFonts,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';

const customTextProps = {
  style: {
    fontWeight: '400',
    fontFamily: typography.primary,
    color: '#002EDC',
  }
};

const originalRender = (Text as any).render;
(Text as any).render = function render(props: any) {
  const mergedProps = { ...props, style: [customTextProps.style, props.style] };
  return originalRender.apply(this, [mergedProps]);
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });
  
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useTrackAppTime();

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