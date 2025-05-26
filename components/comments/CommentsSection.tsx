import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView,
  Platform
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
      const fetchedComments = await getComments(documentId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        documentId,
        text: newComment,
        createdAt: new Date().toISOString(),
        author: {
          id: user?.id || 'unknown',
          name: user?.name || 'Unknown User',
          avatar: user?.avatar || undefined
        },
        replies: []
      };
      
      await addComment(comment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const handleReply = (parentId: string, replyText: string) => {
    const updatedComments = comments.map(comment => {
      if (comment.id === parentId) {
        const newReply: Comment = {
          id: Date.now().toString(),
          documentId,
          text: replyText,
          createdAt: new Date().toISOString(),
          author: {
            id: user?.id || 'unknown',
            name: user?.name || 'Unknown User',
            avatar: user?.avatar || undefined
          },
          parentId: comment.id,
          replies: []
        };
        
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    });
    
    setComments(updatedComments);
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C2340',
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A869A',
    marginLeft: 8,
  },
  commentsList: {
    maxHeight: 300,
  },
  commentsContent: {
    padding: 16,
  },
  loadingText: {
    padding: 16,
    color: '#7A869A',
    textAlign: 'center',
  },
  emptyText: {
    padding: 16,
    color: '#7A869A',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#333333',
  },
  sendButton: {
    backgroundColor: '#0C2340',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E1E1E1',
  },
});