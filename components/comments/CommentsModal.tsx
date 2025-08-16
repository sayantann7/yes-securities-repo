import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, X } from 'lucide-react-native';
import { getComments, addComment } from '@/services/commentService';
import { Comment } from '@/types';
import CommentItem from '@/components/comments/CommentItem';
import { useAuth } from '@/context/AuthContext';

interface CommentsModalProps {
  visible: boolean;
  documentId: string;
  onClose: () => void;
  onCommentsCountChange?: (count: number) => void;
}

export default function CommentsModal({ visible, documentId, onClose, onCommentsCountChange }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!visible) return;
    fetchComments();
  }, [visible, documentId]);

  useEffect(() => {
    onCommentsCountChange?.(comments.length);
  }, [comments, onCommentsCountChange]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const fetched = await getComments(documentId);
      setComments(fetched);
    } catch (e) {
      console.error('Failed to fetch comments', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      documentId,
      text: newComment,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id || 'unknown',
        name: user.name || 'Unknown User',
        avatar: user.avatar || undefined,
        email: user.email || ''
      },
      replies: []
    };

    try {
      const saved = await addComment(comment);
      setComments(prev => [saved, ...prev]);
      setNewComment('');
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* backdrop */}
      </Pressable>
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Text style={styles.loadingText}>Loading comments...</Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CommentItem comment={item} onReply={() => {}} />
              )}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.empty}>No comments yet</Text>}
              showsVerticalScrollIndicator={false}
            />
          )}

          <SafeAreaView edges={["bottom"]}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
                disabled={!newComment.trim()}
                onPress={handleAddComment}
              >
                <Send size={20} color={newComment.trim() ? '#FFFFFF' : '#D1D5DB'} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0C2340' },
  count: { fontSize: 14, color: '#6B7280' },
  closeBtn: { position: 'absolute', right: 10, padding: 6 },
  loadingText: { padding: 14, textAlign: 'center', color: '#6B7280' },
  list: { maxHeight: '100%' },
  listContent: { padding: 14 },
  empty: { textAlign: 'center', color: '#6B7280', paddingVertical: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginRight: 10,
  },
  sendBtn: { backgroundColor: '#0C2340', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  sendBtnDisabled: { backgroundColor: '#A0AEC0' },
});
