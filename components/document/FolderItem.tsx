import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderOpen } from 'lucide-react-native';
import { Folder } from '@/types';

interface FolderItemProps {
  folder: Folder;
  onPress: () => void;
}

export default function FolderItem({ folder, onPress }: FolderItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <FolderOpen size={24} color="#FBBC05" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.folderName}>{folder.name}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            {folder.itemCount || 0} {folder.itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.metaText}>{folder.createdAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
  },
  metaText: {
    fontSize: 12,
    color: '#7A869A',
    marginRight: 12,
  },
});