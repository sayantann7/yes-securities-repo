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
        return <File size={24} color="#7A869A" />;
    }
  };
  
  if (viewMode === 'grid') {
    return (
      <TouchableOpacity style={styles.gridItem} onPress={handlePress}>
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
    <TouchableOpacity style={styles.listItem} onPress={handlePress}>
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
    width: 160,
    marginRight: 16,
    marginBottom: 16,
  },
  gridIconContainer: {
    width: 160,
    height: 120,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  gridInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridDate: {
    fontSize: 12,
    color: '#7A869A',
  },
  gridSize: {
    fontSize: 12,
    color: '#7A869A',
  },
  listItem: {
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
  listIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  listSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDate: {
    fontSize: 12,
    color: '#7A869A',
    marginRight: 12,
  },
  listSize: {
    fontSize: 12,
    color: '#7A869A',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});