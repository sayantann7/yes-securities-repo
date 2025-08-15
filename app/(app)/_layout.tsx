import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useTrackAppTime } from '@/hooks/useTrackAppTime';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize app time tracking for authenticated users
  useTrackAppTime();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A5F7A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: styles.contentStyle,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="document/[id]" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="folder/[id]" 
        options={{ 
          animation: 'slide_from_right',
          gestureEnabled: true,
        }} 
      />
      {/* Support deep folder paths using catch-all and redirect to [id] */}
      <Stack.Screen 
        name="folder/[...id]" 
        options={{ 
          animation: 'slide_from_right',
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A5F7A',
    fontWeight: '500',
  },
  contentStyle: {
    backgroundColor: '#F8F9FB',
  },
});