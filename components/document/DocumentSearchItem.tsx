import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Calendar, User } from 'lucide-react-native';
import { Document } from '@/types';
import { Colors } from '@/constants/Colors';

interface DocumentSearchItemProps {
  document: Document;
  searchTerm: string;
  onPress?: () => void;
}

export default function DocumentSearchItem({ document, searchTerm, onPress }: DocumentSearchItemProps) {

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) => (
      <Text
        key={index}
        style={part.toLowerCase() === term.toLowerCase() ? { backgroundColor: Colors.warning } : {}}
      >
        {part}
      </Text>
    ));
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: Colors.surface, borderBottomColor: Colors.borderLight }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceVariant }]}>
        <FileText size={20} color={Colors.primary} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors.text }]}>
          {highlightSearchTerm(document.name, searchTerm)}
        </Text>
        
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <User size={12} color={Colors.textSecondary} />
            <Text style={[styles.metaText, { color: Colors.textSecondary }]}>
              {document.author || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Calendar size={12} color={Colors.textSecondary} />
            <Text style={[styles.metaText, { color: Colors.textSecondary }]}>
              {new Date(document.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {document.content && (
          <Text style={[styles.preview, { color: Colors.textSecondary }]} numberOfLines={2}>
            {highlightSearchTerm(document.content, searchTerm)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
});