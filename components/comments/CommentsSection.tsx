import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Send } from 'lucide-react-native';
import { getComments, addComment } from '@/services/commentService';
import { Comment } from '@/types';
import CommentItem from '@/components/comments/CommentItem';
import { useAuth } from '@/context/AuthContext';

interface CommentsSectionProps {
  documentId: string;
}

export default function CommentsSection({ documentId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchComments();
  }, [documentId]);
  
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      // Fetch comments via GET
      const fetchedComments = await getComments(documentId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add a comment');
        return;
      }
      
      const comment: Comment = {
        id: Date.now().toString(), // Temporary ID, will be replaced by backend
        documentId,
        text: newComment,
        createdAt: new Date().toISOString(),
        author: {
          id: user.id || 'unknown',
          name: user.name || 'Unknown User',
          avatar: user.avatar || undefined,
          email: user.email || '' // Add email which is needed for the backend
        },
        replies: []
      };
      
      const savedComment = await addComment(comment);
      setComments(prev => [savedComment, ...prev]);
      setNewComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.message || 'Failed to add comment. Please try again.');
    }
  };
  
  const handleReply = (parentId: string, replyText: string) => {
    // Since your backend doesn't support nested replies yet,
    // we'll simplify this by treating replies as top-level comments
    if (!user) {
      Alert.alert('Error', 'You must be logged in to reply');
      return;
    }
    
    const newReply: Comment = {
      id: Date.now().toString(),
      documentId,
      text: `Reply to comment: ${replyText}`, // Add context since we can't link to parent
      createdAt: new Date().toISOString(),
      author: {
        id: user.id || 'unknown',
        name: user.name || 'Unknown User',
        avatar: user.avatar || undefined,
        email: user.email || ''
      },
      parentId: parentId, // Keep this for frontend reference
      replies: []
    };
    
    addComment(newReply)
      .then(savedReply => {
        setComments(prev => [savedReply, ...prev]);
      })
      .catch(error => {
        console.error('Error adding reply:', error);
        Alert.alert('Error', 'Failed to add reply. Please try again.');
      });
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <Text style={styles.count}>{comments.length}</Text>
      </View>
      
      {isLoading ? (
        <Text style={styles.loadingText}>Loading comments...</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem comment={item} onReply={handleReply} />
          )}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No comments yet</Text>
          }
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#7A869A"
          multiline
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          disabled={!newComment.trim()}
          onPress={handleAddComment}
        >
          <Send size={20} color={newComment.trim() ? "#FFFFFF" : "#A0AEC0"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Define styles for CommentsSection
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E1E1E1' },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0C2340' },
  count: { fontSize: 14, color: '#7A869A' },
  loadingText: { padding: 10, textAlign: 'center', color: '#7A869A' },
  commentsList: { flex: 1 },
  commentsContent: { padding: 10 },
  emptyText: { textAlign: 'center', color: '#7A869A', marginTop: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E1E1E1', padding: 10, backgroundColor: '#FFFFFF' },
  input: { flex: 1, borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, fontSize: 14, color: '#333333' },
  sendButton: { backgroundColor: '#0C2340', padding: 10, borderRadius: 20 },
  sendButtonDisabled: { backgroundColor: '#A0AEC0' },
});