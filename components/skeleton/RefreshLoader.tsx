import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

interface RefreshLoaderProps {
  text?: string;
  size?: 'small' | 'large';
}

export default function RefreshLoader({ text = 'Loading...', size = 'small' }: RefreshLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      <Text style={[styles.text, { color: Colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
  },
});
