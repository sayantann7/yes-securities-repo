import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FileText, FileImage, FileVideo, FileAudio, File } from 'lucide-react-native';
import { router } from 'expo-router';
import { Document } from '@/types';

interface RecentDocumentItemProps {
  document: Document;
}

export function RecentDocumentItem({ document }: RecentDocumentItemProps) {
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
        return <File size={24} color="#7A869A" />;
    }
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.iconContainer}>
        {document.type === 'image' && document.thumbnailUrl ? (
          <Image source={{ uri: document.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          getDocumentIcon()
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>{document.name}</Text>
      <Text style={styles.date}>{document.createdAt}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
  },
  iconContainer: {
    width: 140,
    height: 100,
    backgroundColor: '#F0F4F8',
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
    color: '#333333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#7A869A',
  },
});