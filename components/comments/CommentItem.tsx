import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { MessageSquare, Heart, Clock } from 'lucide-react-native';
import { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, text: string) => void;
  isReply?: boolean;
}

export default function CommentItem({ comment, onReply, isReply = false }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  
  const handleLike = () => {
    setLiked(!liked);
  };
  
  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
    }
  };
  
  const formattedDate = () => {
    const date = new Date(comment.createdAt);
    
    // If less than 24 hours ago, show relative time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${Math.floor(diffHours)} hours ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <Image 
        source={{ uri: comment.author.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }} 
        style={styles.avatar}
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <View style={styles.timestamp}>
            <Clock size={12} color="#7A869A" style={{ marginRight: 4 }} />
            <Text style={styles.timestampText}>{formattedDate()}</Text>
          </View>
        </View>
        
        <Text style={styles.commentText}>{comment.text}</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Heart size={16} color={liked ? "#E53935" : "#7A869A"} fill={liked ? "#E53935" : "transparent"} />
            <Text style={[styles.actionText, liked && styles.likedText]}>Like</Text>
          </TouchableOpacity>
          
          {!isReply && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setIsReplying(!isReplying)}
            >
              <MessageSquare size={16} color="#7A869A" />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isReplying && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor="#7A869A"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <View style={styles.replyButtonsContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsReplying(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, !replyText.trim() && styles.submitButtonDisabled]}
                disabled={!replyText.trim()}
                onPress={handleReplySubmit}
              >
                <Text style={styles.submitButtonText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id}
                comment={reply}
                onReply={onReply}
                isReply={true}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  replyContainer: {
    marginTop: 12,
    marginLeft: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C2340',
    marginRight: 8,
  },
  timestamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#7A869A',
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#7A869A',
    marginLeft: 4,
  },
  likedText: {
    color: '#E53935',
  },
  replyInputContainer: {
    marginTop: 8,
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    padding: 8,
  },
  replyInput: {
    fontSize: 14,
    color: '#333333',
    minHeight: 40,
  },
  replyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#7A869A',
  },
  submitButton: {
    backgroundColor: '#0C2340',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
});