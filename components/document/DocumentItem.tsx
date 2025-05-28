import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FileText, FileImage, FileVideo, FileAudio, File } from 'lucide-react-native';
import { router } from 'expo-router';
import { Document } from '@/types';

interface DocumentItemProps {
  document: Document;
  viewMode?: 'grid' | 'list';
  onPress?: () => void;
}

export default function DocumentItem({ document, viewMode = 'list', onPress }: DocumentItemProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/document/${document.id}`);
    }
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
        return <File size={24} color="#94A3B8" />;
    }
  };
  
  if (viewMode === 'grid') {
    return (
      <TouchableOpacity 
        style={styles.gridItem} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.gridIconContainer}>
          {document.type === 'image' && document.thumbnailUrl ? (
            <Image source={{ uri: document.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            getDocumentIcon()
          )}
        </View>
        <Text style={styles.gridName} numberOfLines={2}>{document.name}</Text>
        <View style={styles.gridInfo}>
          <Text style={styles.gridDate}>{document.createdAt}</Text>
          <Text style={styles.gridSize}>{document.size}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={styles.listItem} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.listIconContainer}>
        {document.type === 'image' && document.thumbnailUrl ? (
          <Image source={{ uri: document.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          getDocumentIcon()
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName} numberOfLines={1}>{document.name}</Text>
        <View style={styles.listSubInfo}>
          <Text style={styles.listDate}>{document.createdAt}</Text>
          <Text style={styles.listSize}>{document.size}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    width: 180,
    marginRight: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridIconContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gridName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
    lineHeight: 20,
  },
  gridInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  gridSize: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  listItem: {
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
  listIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  listSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 12,
  },
  listSize: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});