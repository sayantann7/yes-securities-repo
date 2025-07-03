import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminScreen() {
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
