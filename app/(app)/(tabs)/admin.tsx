import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminScreen() {
  const { user } = useAuth();

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <AdminDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
