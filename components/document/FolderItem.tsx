import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Folder as FolderIcon, MoreHorizontal } from 'lucide-react-native';
import { Folder } from '@/types';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/font';
import { useAuth } from '@/context/AuthContext';
import { renameFolder, deleteFolder } from '@/services/folderService';
import { toggleBookmark, checkIfBookmarked } from '@/services/bookmarkService';
import FileActionModal from './FileActionModal';

interface FolderItemProps {
  folder: Folder;
  onPress: () => void;
  onUpdate?: () => void; // Callback to refresh folder list after rename/delete
  viewMode?: 'list' | 'grid';
}

export default function FolderItem({ folder, onPress, onUpdate, viewMode = 'list' }: FolderItemProps) {
  const { user } = useAuth();
  const [showActionModal, setShowActionModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(folder.isBookmarked || false);
  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    console.log('🔄 FolderItem useEffect - setting initial bookmark status:', folder.isBookmarked);
    console.log('🖼️ Folder icon URL for', folder.name, ':', folder.iconUrl);
    setIsBookmarked(folder.isBookmarked || false);
    // Reset icon error when folder changes
    setIconError(false);
  }, [folder.isBookmarked, folder.id, folder.iconUrl]);

  const handleMorePress = (e: any) => {
    e.stopPropagation(); // Prevent triggering folder navigation
    setShowActionModal(true);
  };

  const handleRename = async (newName: string) => {
    await renameFolder(folder.id, newName);
    onUpdate?.();
  };

  const handleDelete = async () => {
    await deleteFolder(folder.id);
    onUpdate?.();
  };

  const handleBookmark = async () => {
    try {
      console.log('🔖 FolderItem handleBookmark called for:', { id: folder.id, name: folder.name });
      const result = await toggleBookmark(folder.id, 'folder', folder.name);
      console.log('📋 toggleBookmark result:', result);
      setIsBookmarked(result.isBookmarked);
      console.log('🎯 isBookmarked state updated to:', result.isBookmarked);
      
      // Also trigger a data refresh if the callback is available
      onUpdate?.();
      console.log('🔄 onUpdate called');
    } catch (error) {
      console.error('💥 Error toggling bookmark:', error);
    }
  };

  if (viewMode === 'grid') {
    return (
      <>
        <TouchableOpacity 
          style={[styles.gridItem, { backgroundColor: Colors.surface }]} 
          onPress={onPress}
        >        <View style={[styles.gridIconContainer, { backgroundColor: Colors.surfaceVariant }]}>
          {folder.iconUrl && !iconError ? (
            <Image 
              source={{ uri: folder.iconUrl }} 
              style={styles.gridCustomIcon}
              resizeMode="cover"
              onError={(error) => {
                console.log('🚫 Grid icon failed to load for folder:', folder.name);
                console.log('🚫 Error details:', error.nativeEvent);
                console.log('🚫 Icon URL was:', folder.iconUrl);
                setIconError(true);
              }}
            />
          ) : (
            <FolderIcon size={32} color="#6B73FF" />
          )}
        </View>
          <Text style={[styles.gridTitle, { color: Colors.text }]} numberOfLines={2}>
            {folder.name}
          </Text>
          <Text style={[styles.gridSubtitle, { color: Colors.textSecondary }]}>
            {folder.itemCount || 0} items
          </Text>
          {/* Show more button for all users */}
          <TouchableOpacity style={styles.gridMoreButton} onPress={handleMorePress}>
            <MoreHorizontal size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        <FileActionModal
          visible={showActionModal}
          onClose={() => setShowActionModal(false)}
          itemName={folder.name}
          itemType="folder"
          itemId={folder.id}
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
        style={[styles.container, { backgroundColor: Colors.surface, borderBottomColor: Colors.borderLight }]}
        onPress={onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceVariant }]}>
          {folder.iconUrl && !iconError ? (
            <Image 
              source={{ uri: folder.iconUrl }} 
              style={styles.customIcon}
              resizeMode="cover"
              onError={(error) => {
                console.log('🚫 List icon failed to load for folder:', folder.name);
                console.log('🚫 Error details:', error.nativeEvent);
                console.log('🚫 Icon URL was:', folder.iconUrl);
                setIconError(true);
              }}
            />
          ) : (
            <FolderIcon size={24} color="#6B73FF" />
          )}
        </View>
        
        <View style={styles.folderInfo}>
          <Text style={[styles.folderName, { color: Colors.text }]} numberOfLines={1}>
            {folder.name}
          </Text>
          <Text style={[styles.folderCount, { color: Colors.textSecondary }]}>
            {folder.itemCount || 0} items
          </Text>
        </View>
        
        {/* Show more button for all users */}
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
          <MoreHorizontal size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      <FileActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        itemName={folder.name}
        itemType="folder"
        itemId={folder.id}
        isBookmarked={isBookmarked}
        onRename={handleRename}
        onDelete={handleDelete}
        onBookmark={handleBookmark}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: typography.medium,
  },
  folderCount: {
    fontSize: 12,
    fontFamily: typography.primary,
  },
  moreButton: {
    padding: 8,
  },
  // Grid view styles
  gridItem: {
    width: '48%',
    padding: 16,
    margin: 4,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  gridIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 32,
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
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  gridCustomIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
});