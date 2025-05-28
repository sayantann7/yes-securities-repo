import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderOpen } from 'lucide-react-native';
import { Folder } from '@/types';

interface FolderItemProps {
  folder: Folder;
  onPress: () => void;
}

export default function FolderItem({ folder, onPress }: FolderItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FolderOpen size={24} color="#FBBC05" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.folderName}>{folder.name}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            {folder.itemCount || 0} {folder.itemCount === 1 ? 'item' : 'items'}
          </Text>
          <View style={styles.metaDot} />
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
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
    marginHorizontal: 8,
  },
});