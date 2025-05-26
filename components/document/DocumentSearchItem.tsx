import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, FileImage, FileVideo, FileAudio, File } from 'lucide-react-native';
import { router } from 'expo-router';
import { Document } from '@/types';

interface DocumentSearchItemProps {
  document: Document;
  searchTerm: string;
}

export default function DocumentSearchItem({ document, searchTerm }: DocumentSearchItemProps) {
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
  
  // Highlight search term in document name or content
  const highlightMatches = (text: string) => {
    if (!searchTerm || searchTerm.trim() === '') return text;
    
    const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <Text key={i} style={styles.highlight}>{part}</Text>;
      }
      return part;
    });
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.iconContainer}>
        {getDocumentIcon()}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>
          {highlightMatches(document.name)}
        </Text>
        
        {document.content && (
          <Text style={styles.contentPreview} numberOfLines={2}>
            {highlightMatches(document.content)}
          </Text>
        )}
        
        <View style={styles.metaContainer}>
          <Text style={styles.meta}>{document.type.toUpperCase()}</Text>
          <Text style={styles.meta}>•</Text>
          <Text style={styles.meta}>{document.createdAt}</Text>
          <Text style={styles.meta}>•</Text>
          <Text style={styles.meta}>{document.author}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  contentPreview: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: '#7A869A',
    marginRight: 6,
  },
  highlight: {
    backgroundColor: '#FFF9C4',
    color: '#333333',
  },
});