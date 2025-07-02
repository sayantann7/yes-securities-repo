import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Folder as FolderIcon, MoreHorizontal } from 'lucide-react-native';
import { Folder } from '@/types';
import { Colors } from '@/constants/Colors';

interface FolderItemProps {
  folder: Folder;
  onPress: () => void;
}

export default function FolderItem({ folder, onPress }: FolderItemProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: Colors.surface, borderBottomColor: Colors.borderLight }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceVariant }]}>
        <FolderIcon size={24} color="#6B73FF" />
      </View>
      
      <View style={styles.folderInfo}>
        <Text style={[styles.folderName, { color: Colors.text }]} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={[styles.folderCount, { color: Colors.textSecondary }]}>
          {folder.itemCount || 0} items
        </Text>
      </View>
      
      <TouchableOpacity style={styles.moreButton}>
        <MoreHorizontal size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
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
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  folderCount: {
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
  },
});