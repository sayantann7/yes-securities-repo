import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FileText, Download, Share, MoreHorizontal } from 'lucide-react-native';
import { Document } from '@/types';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/font';
import { useAuth } from '@/context/AuthContext';
import { renameDocument, deleteDocument } from '@/services/documentService';
import { toggleBookmark, checkIfBookmarked } from '@/services/bookmarkService';
import FileActionModal from './FileActionModal';

interface DocumentItemProps {
  document: Document;
  viewMode: 'list' | 'grid';
  onPress?: () => void;
  onUpdate?: () => void; // Callback to refresh document list after rename/delete
}

export default function DocumentItem({ document, viewMode, onPress, onUpdate }: DocumentItemProps) {
  const { user } = useAuth();
  const [showActionModal, setShowActionModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const bookmarked = await checkIfBookmarked(document.id);
        setIsBookmarked(bookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    checkBookmarkStatus();
  }, [document.id]);

  const handleMorePress = (e: any) => {
    e.stopPropagation(); // Prevent triggering document view
    setShowActionModal(true);
  };

  const handleRename = async (newName: string) => {
    // Ensure the new name includes the original file extension if not provided
    const originalExtension = document.name.split('.').pop();
    const newNameParts = newName.split('.');
    const finalName = newNameParts.length === 1 && originalExtension 
      ? `${newName}.${originalExtension}` 
      : newName;
    
    await renameDocument(document.id, finalName);
    onUpdate?.();
  };

  const handleDelete = async () => {
    await deleteDocument(document.id);
    onUpdate?.();
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(document.id, 'document', document.name);
      setIsBookmarked(result.isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const getFileIcon = (type: string) => {
    // Return appropriate icon based on file type
    return <FileText size={20} color={Colors.primary} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (viewMode === 'grid') {
    return (
      <>
        <TouchableOpacity 
          style={[styles.gridItem, { backgroundColor: Colors.surface }]} 
          onPress={onPress}
        >
          <View style={[styles.gridIconContainer, { backgroundColor: Colors.surfaceVariant }]}>
            {document.iconUrl ? (
              <Image 
                source={{ uri: document.iconUrl }} 
                style={styles.gridCustomIcon}
                resizeMode="cover"
              />
            ) : (
              getFileIcon(document.type)
            )}
          </View>
          <Text style={[styles.gridTitle, { color: Colors.text }]} numberOfLines={2}>
            {document.name}
          </Text>
          <Text style={[styles.gridSubtitle, { color: Colors.textSecondary }]}>
            {formatFileSize(Number(document.size))}
          </Text>
          {/* Show more button for all users */}
          <TouchableOpacity style={styles.gridMoreButton} onPress={handleMorePress}>
            <MoreHorizontal size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        <FileActionModal
          visible={showActionModal}
          onClose={() => setShowActionModal(false)}
          itemName={document.name}
          itemType="file"
          itemId={document.id}
          isBookmarked={isBookmarked}
          onRename={handleRename}
          onDelete={handleDelete}
          onBookmark={handleBookmark}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.listItem, { backgroundColor: Colors.surface, borderBottomColor: Colors.borderLight }]} 
        onPress={onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceVariant }]}>
          {document.iconUrl ? (
            <Image 
              source={{ uri: document.iconUrl }} 
              style={styles.customIcon}
              resizeMode="cover"
            />
          ) : (
            getFileIcon(document.type)
          )}
        </View>
        
        <View style={styles.documentInfo}>
          <Text style={[styles.documentName, { color: Colors.text }]} numberOfLines={1}>
            {document.name}
          </Text>
          <View style={styles.documentMeta}>
            <Text style={[styles.documentSize, { color: Colors.textSecondary }]}>
              {document.size}
            </Text>
            <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>
              {new Date(document.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {/* Show more button for all users */}
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
          <MoreHorizontal size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      <FileActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        itemName={document.name}
        itemType="file"
        itemId={document.id}
        isBookmarked={isBookmarked}
        onRename={handleRename}
        onDelete={handleDelete}
        onBookmark={handleBookmark}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  gridItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: typography.medium,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentSize: {
    fontSize: 12,
    marginRight: 8,
    fontFamily: typography.primary,
  },
  documentDate: {
    fontSize: 12,
    fontFamily: typography.primary,
  },
  moreButton: {
    padding: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: typography.medium,
  },
  gridSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: typography.primary,
  },
  gridMoreButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  gridCustomIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
});