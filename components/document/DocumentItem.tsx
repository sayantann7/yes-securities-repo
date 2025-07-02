import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Download, Share, MoreHorizontal } from 'lucide-react-native';
import { Document } from '@/types';
import { Colors } from '@/constants/Colors';

interface DocumentItemProps {
  document: Document;
  viewMode: 'list' | 'grid';
  onPress?: () => void;
}

export default function DocumentItem({ document, viewMode, onPress }: DocumentItemProps) {

  const getFileIcon = (type: string) => {
    // Return appropriate icon based on file type
    return <FileText size={20} color={Colors.primary} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity 
        style={[styles.gridItem, { backgroundColor: Colors.surface }]} 
        onPress={onPress}
      >
        <View style={[styles.gridIconContainer, { backgroundColor: Colors.surfaceVariant }]}>
          {getFileIcon(document.type)}
        </View>
        <Text style={[styles.gridTitle, { color: Colors.text }]} numberOfLines={2}>
          {document.name}
        </Text>
        <Text style={[styles.gridSubtitle, { color: Colors.textSecondary }]}>
          {formatFileSize(Number(document.size))}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.listItem, { backgroundColor: Colors.surface, borderBottomColor: Colors.borderLight }]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceVariant }]}>
        {getFileIcon(document.type)}
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, { color: Colors.text }]} numberOfLines={1}>
          {document.name}
        </Text>
        <View style={styles.documentMeta}>
          <Text style={[styles.documentSize, { color: Colors.textSecondary }]}>
            {document.size}
          </Text>
          <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>
            {new Date(document.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.moreButton}>
        <MoreHorizontal size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  gridItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentSize: {
    fontSize: 12,
    marginRight: 8,
  },
  documentDate: {
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});