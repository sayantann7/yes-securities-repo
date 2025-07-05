import React from 'react';
import { View, StyleSheet } from 'react-native';
import FolderSkeleton from './FolderSkeleton';
import DocumentSkeleton from './DocumentSkeleton';
import SkeletonLoader from './SkeletonLoader';
import { Colors } from '@/constants/Colors';

interface DocumentsPageSkeletonProps {
  viewMode?: 'list' | 'grid';
  showFolders?: boolean;
  showDocuments?: boolean;
}

export default function DocumentsPageSkeleton({ 
  viewMode = 'list', 
  showFolders = true, 
  showDocuments = true 
}: DocumentsPageSkeletonProps) {
  return (
    <View style={styles.container}>
      {showFolders && (
        <>
          {/* Section Title Skeleton */}
          <SkeletonLoader width="30%" height={20} borderRadius={4} style={styles.sectionTitle} />
          
          {/* Folders Skeleton */}
          <View style={[styles.itemsContainer, viewMode === 'grid' && styles.gridContainer]}>
            {Array.from({ length: viewMode === 'grid' ? 4 : 3 }, (_, index) => (
              <FolderSkeleton 
                key={`folder-skeleton-${index}`} 
                viewMode={viewMode} 
              />
            ))}
          </View>
        </>
      )}
      
      {showDocuments && (
        <>
          {/* Section Title Skeleton */}
          <SkeletonLoader width="35%" height={20} borderRadius={4} style={styles.sectionTitle} />
          
          {/* Documents Skeleton */}
          <View style={[styles.itemsContainer, viewMode === 'grid' && styles.gridContainer]}>
            {Array.from({ length: viewMode === 'grid' ? 8 : 6 }, (_, index) => (
              <DocumentSkeleton 
                key={`document-skeleton-${index}`} 
                viewMode={viewMode} 
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  itemsContainer: {
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
