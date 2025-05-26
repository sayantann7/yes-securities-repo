import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <Provider store={store}>
      <AuthProvider>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              contentStyle: styles.contentStyle,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
          </Stack>
        </View>
      </AuthProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  contentStyle: {
    backgroundColor: '#F5F5F7',
  },
});