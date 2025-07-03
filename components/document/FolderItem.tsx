import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Folder as FolderIcon, MoreHorizontal } from 'lucide-react-native';
import { Folder } from '@/types';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/font';
import { useAuth } from '@/context/AuthContext';
import { renameFolder, deleteFolder } from '@/services/folderService';
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

  // Debug logging to check if iconUrl is being received
  console.log('FolderItem Debug - Folder:', {
    name: folder.name,
    id: folder.id,
    iconUrl: folder.iconUrl,
    hasIconUrl: !!folder.iconUrl
  });

  const handleMorePress = (e: any) => {
    e.stopPropagation(); // Prevent triggering folder navigation
    if (user?.role === 'admin') {
      setShowActionModal(true);
    }
  };

  const handleRename = async (newName: string) => {
    await renameFolder(folder.id, newName);
    onUpdate?.();
  };

  const handleDelete = async () => {
    await deleteFolder(folder.id);
    onUpdate?.();
  };

  if (viewMode === 'grid') {
    return (
      <>
        <TouchableOpacity 
          style={[styles.gridItem, { backgroundColor: Colors.surface }]} 
          onPress={onPress}
        >
          <View style={[styles.gridIconContainer, { backgroundColor: Colors.surfaceVariant }]}>
            {folder.iconUrl ? (
              <Image 
                source={{ uri: folder.iconUrl }} 
                style={styles.gridCustomIcon}
                resizeMode="cover"
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
          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.gridMoreButton} onPress={handleMorePress}>
              <MoreHorizontal size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <FileActionModal
          visible={showActionModal}
          onClose={() => setShowActionModal(false)}
          itemName={folder.name}
          itemType="folder"
          onRename={handleRename}
          onDelete={handleDelete}
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
          {folder.iconUrl ? (
            <Image 
              source={{ uri: folder.iconUrl }} 
              style={styles.customIcon}
              resizeMode="cover"
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
        
        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
            <MoreHorizontal size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <FileActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        itemName={folder.name}
        itemType="folder"
        onRename={handleRename}
        onDelete={handleDelete}
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