import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronLeft, Download, Share2, Star, MessageSquare, Bookmark } from 'lucide-react-native';
import { getDocumentById } from '@/services/documentService';
import { getComments } from '@/services/commentService';
import { Document as DocumentType } from '@/types';
import PDFViewer from '@/components/viewers/PDFViewer';
import ImageViewer from '@/components/viewers/ImageViewer';
import VideoViewer from '@/components/viewers/VideoViewer';
import CommentsSection from '@/components/comments/CommentsSection';
import { Colors } from '@/constants/Colors';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  // Build correct document ID from segments
  const documentId = Array.isArray(id) ? id.join('/') : id;
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const doc = await getDocumentById(documentId);
        setDocument(doc);
      } catch (err) {
        setError('Failed to load document. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  // Fetch initial comment count on page load
  useEffect(() => {
    const fetchCommentsCount = async () => {
      try {
        if (!documentId) return;
        const fetched = await getComments(documentId);
        setCommentsCount(fetched.length);
      } catch (error) {
        console.error('Error fetching initial comments count:', error);
      }
    };
    fetchCommentsCount();
  }, [documentId]);

  const handleBack = () => {
    router.back();
  };

  const handleDownload = () => {
    if (Platform.OS === 'web') {
      window.open(document?.url, '_blank');
    } else {
      alert('Downloading document...');
    }
  };

  const handleShare = () => {
    alert('Sharing document...');
  };

  const renderDocumentViewer = () => {
    if (!document) return null;

    switch (document.type) {
      case 'pdf':
        return <PDFViewer uri={document.url} />;
      case 'image':
        return <ImageViewer uri={document.url} />;
      case 'video':
        return <VideoViewer uri={document.url} />;
      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              This file type cannot be previewed directly.
            </Text>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
              <Download size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C2340" />
        <Text style={styles.loadingText}>Loading document...</Text>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Document not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F5F5F7' }]}>
      <View style={[styles.header, { backgroundColor: '#FFFFFF', borderBottomColor: '#E1E1E1' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: Colors.primary }]} numberOfLines={1}>{document.name}</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>{document.size} • {document.createdAt}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Star size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <Download size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.content, { backgroundColor: Colors.surface, borderRadius: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
        {renderDocumentViewer()}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, showComments && styles.footerButtonActive]}
          onPress={() => setShowComments(!showComments)}
        >
          <MessageSquare size={20} color={showComments ? "#0C2340" : "#7A869A"} />
          <Text style={[styles.footerButtonText, showComments && styles.footerButtonTextActive]}>
            Comments ({commentsCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Bookmark size={20} color="#7A869A" />
          <Text style={styles.footerButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      {showComments && (
        <CommentsSection documentId={document.id} onCommentsCountChange={setCommentsCount} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  backBtn: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2340',
  },
  subtitle: {
    fontSize: 12,
    color: '#7A869A',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A869A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0C2340',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#7A869A',
    textAlign: 'center',
    marginBottom: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0C2340',
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerButtonActive: {
    backgroundColor: '#F0F4F8',
  },
  footerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7A869A',
  },
  footerButtonTextActive: {
    color: '#0C2340',
    fontWeight: '500',
  },
});
