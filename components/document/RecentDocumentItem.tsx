import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FileText, FileImage, FileVideo, FileAudio, File } from 'lucide-react-native';
import { router } from 'expo-router';
import { Document } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

interface RecentDocumentItemProps {
  document: Document;
}

export function RecentDocumentItem({ document }: RecentDocumentItemProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const handlePress = () => {
    router.push(`/document/${document.id}`);
  };
  
  const getDocumentIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText size={24} color="#E53935" />;
      case 'image':
        return <FileImage size={24} color="#4285F4" />;
      case 'video':
        return <FileVideo size={24} color="#34A853" />;
      case 'audio':
        return <FileAudio size={24} color="#FBBC05" />;
      default:
        return <File size={24} color={colors.textSecondary} />;
    }
  };
  
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.surface }]} onPress={handlePress}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        {document.type === 'image' && document.thumbnailUrl ? (
          <Image source={{ uri: document.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          getDocumentIcon()
        )}
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {document.name}
      </Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {document.createdAt}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 124,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
});