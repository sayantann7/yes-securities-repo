import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Folder as FolderIcon, MoreHorizontal } from 'lucide-react-native';
import { Folder } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

interface FolderItemProps {
  folder: Folder;
  onPress: () => void;
}

export default function FolderItem({ folder, onPress }: FolderItemProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <FolderIcon size={24} color="#6B73FF" />
      </View>
      
      <View style={styles.folderInfo}>
        <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={[styles.folderCount, { color: colors.textSecondary }]}>
          {folder.itemCount || 0} items
        </Text>
      </View>
      
      <TouchableOpacity style={styles.moreButton}>
        <MoreHorizontal size={20} color={colors.textSecondary} />
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