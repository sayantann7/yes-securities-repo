import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MessageCircle, Send, Trash2, ChevronDown, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { AdminCommentView, Comment } from '@/types';
import { adminCommentService } from '@/services/adminCommentService';
import { useAuth } from '@/context/AuthContext';

interface CommentViewItemProps {
  documentView: AdminCommentView;
  onReply: (documentId: string, replyText: string) => void;
  onDelete: (commentId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CommentViewItem = ({ 
  documentView, 
  onReply, 
  onDelete, 
  isExpanded, 
  onToggleExpand 
}: CommentViewItemProps) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(documentView.documentId, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <View style={[styles.documentItem, { backgroundColor: Colors.surface }]}>
      <TouchableOpacity 
        style={styles.documentHeader} 
        onPress={onToggleExpand}
      >
        <View style={styles.documentHeaderLeft}>
          {isExpanded ? (
            <ChevronDown size={20} color={Colors.textSecondary} />
          ) : (
            <ChevronRight size={20} color={Colors.textSecondary} />
          )}
          <Text style={[styles.documentName, { color: Colors.text }]}>
            {documentView.documentName || 'Unknown Document'}
          </Text>
        </View>
        <View style={styles.commentCount}>
          <MessageCircle size={16} color={Colors.textSecondary} />
          <Text style={[styles.commentCountText, { color: Colors.textSecondary }]}>
            {documentView.comments.length}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.commentsSection}>
          {(documentView.comments || []).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={[styles.commentAuthor, { color: Colors.text }]}>
                  {comment.author?.name || 'User'}
                </Text>
                <View style={styles.commentActions}>
                  <Text style={[styles.commentTime, { color: Colors.textSecondary }]}>
                    {comment?.createdAt ? getTimeAgo(comment.createdAt) : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete Comment',
                        'Are you sure you want to delete this comment?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive', 
                            onPress: () => onDelete(comment.id) 
                          },
                        ]
                      );
                    }}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.commentText, { color: Colors.text }]}>
                {comment.text}
              </Text>
            </View>
          ))}

          <View style={styles.replySection}>
            {!showReplyInput ? (
              <TouchableOpacity
                style={[styles.replyButton, { backgroundColor: Colors.primary }]}
                onPress={() => setShowReplyInput(true)}
              >
                <MessageCircle size={16} color="white" />
                <Text style={styles.replyButtonText}>Reply as Admin</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.replyInputContainer}>
                <TextInput
                  style={[styles.replyInput, { borderColor: Colors.border, color: Colors.text }]}
                  placeholder="Type your reply..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  value={replyText}
                  onChangeText={setReplyText}
                />
                <View style={styles.replyActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowReplyInput(false);
                      setReplyText('');
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={[styles.cancelButtonText, { color: Colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleReply}
                    disabled={!replyText.trim()}
                    style={[
                      styles.sendReplyButton,
                      { 
                        backgroundColor: replyText.trim() ? Colors.primary : Colors.textSecondary 
                      }
                    ]}
                  >
                    <Send size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default function AdminCommentsPage() {
  const [commentViews, setCommentViews] = useState<AdminCommentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.');
      return;
    }
    fetchComments();
  }, [user]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const views = await adminCommentService.getAllCommentsGrouped();
      setCommentViews(views);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments');
      setCommentViews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (documentId: string, replyText: string) => {
    try {
      const newComment = await adminCommentService.replyToComment(documentId, replyText);
      
      // Update the comment views with the new reply
      setCommentViews(prev =>
        prev.map(view =>
          view.documentId === documentId
            ? { ...view, comments: [...view.comments, newComment] }
            : view
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add reply');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await adminCommentService.deleteComment(commentId);
      
      // Remove the comment from the views
      setCommentViews(prev =>
        prev.map(view => ({
          ...view,
          comments: view.comments.filter(comment => comment.id !== commentId)
        })).filter(view => view.comments.length > 0) // Remove documents with no comments
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete comment');
    }
  };

  const toggleDocumentExpansion = (documentId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={[styles.accessDeniedText, { color: Colors.error }]}>
          Access Denied: Admin privileges required
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
          Loading comments...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: Colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: Colors.primary }]}
          onPress={fetchComments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>
          Document Comments
        </Text>
        <TouchableOpacity onPress={fetchComments} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: Colors.primary }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {commentViews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color={Colors.textSecondary} />
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
            No comments found
          </Text>
        </View>
      ) : (
        <FlatList
          data={commentViews}
          keyExtractor={(item) => item.documentId}
          renderItem={({ item }) => (
            <CommentViewItem
              documentView={item}
              onReply={handleReply}
              onDelete={handleDeleteComment}
              isExpanded={expandedDocuments.has(item.documentId)}
              onToggleExpand={() => toggleDocumentExpansion(item.documentId)}
            />
          )}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '500',
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 16,
  },
  documentItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCountText: {
    fontSize: 14,
    marginLeft: 4,
  },
  commentsSection: {
    padding: 16,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 12,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  replySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  replyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  replyInputContainer: {
    gap: 12,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  sendReplyButton: {
    padding: 10,
    borderRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
