import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { Colors } from '@/constants/Colors';

interface FolderSkeletonProps {
  viewMode?: 'list' | 'grid';
}

export default function FolderSkeleton({ viewMode = 'list' }: FolderSkeletonProps) {
  if (viewMode === 'grid') {
    return (
      <View style={styles.gridItem}>
        <SkeletonLoader width={48} height={48} borderRadius={12} style={styles.gridIcon} />
        <SkeletonLoader width="80%" height={16} borderRadius={4} style={styles.gridTitle} />
        <SkeletonLoader width="60%" height={12} borderRadius={4} />
      </View>
    );
  }

  return (
    <View style={[styles.listItem, { backgroundColor: Colors.surface }]}>
      <SkeletonLoader width={40} height={40} borderRadius={8} style={styles.listIcon} />
      <View style={styles.listContent}>
        <SkeletonLoader width="70%" height={16} borderRadius={4} style={styles.listTitle} />
        <SkeletonLoader width="40%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  listIcon: {
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    marginBottom: 4,
  },
  gridItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  gridIcon: {
    marginBottom: 8,
  },
  gridTitle: {
    marginBottom: 4,
  },
});
