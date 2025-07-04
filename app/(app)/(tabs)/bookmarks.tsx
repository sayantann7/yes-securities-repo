import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { BookmarkCheck, Folder as FolderIcon, FileText, Trash2, Grid, List, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Bookmark } from '@/types';
import { getBookmarks, removeBookmark } from '@/services/bookmarkService';
import { useAuth } from '@/context/AuthContext';

interface BookmarkItemProps {
  bookmark: Bookmark;
  onPress: () => void;
  onRemove: () => void;
  viewMode: 'list' | 'grid';
}

const BookmarkItem = ({ bookmark, onPress, onRemove, viewMode }: BookmarkItemProps) => {
  const getIcon = () => {
    if (bookmark.itemType === 'folder') {
      return <FolderIcon size={viewMode === 'grid' ? 32 : 24} color="#6B73FF" />;
    } else {
      return <FileText size={viewMode === 'grid' ? 32 : 24} color={Colors.primary} />;
    }
  };

  const handleRemove = (e: any) => {
    e.stopPropagation();
    Alert.alert(
      'Remove Bookmark',
      `Are you sure you want to remove "${bookmark.itemName}" from bookmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ]
    );
  };

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity 
        style={[styles.gridItem, { backgroundColor: Colors.surface }]} 
        onPress={onPress}
      >
        <View style={[styles.gridIconContainer, { backgroundColor: Colors.surfaceVariant }]}>
          {getIcon()}
        </View>
        <Text style={[styles.gridTitle, { color: Colors.text }]} numberOfLines={2}>
          {bookmark.itemName}
        </Text>
        <Text style={[styles.gridSubtitle, { color: Colors.textSecondary }]}>
          {bookmark.itemType}
        </Text>
        <TouchableOpacity style={styles.gridRemoveButton} onPress={handleRemove}>
          <Trash2 size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.listItem, { backgroundColor: Colors.surface, borderBottomColor: Colors.borderLight }]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceVariant }]}>
        {getIcon()}
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: Colors.text }]} numberOfLines={1}>
          {bookmark.itemName}
        </Text>
        <Text style={[styles.itemType, { color: Colors.textSecondary }]}>
          {bookmark.itemType} • {new Date(bookmark.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
        <Trash2 size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function BookmarksScreen() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkPress = (bookmark: Bookmark) => {
    if (bookmark.itemType === 'folder') {
      router.push(`/folder/${bookmark.itemId}`);
    } else if (bookmark.itemType === 'document') {
      router.push(`/document/${bookmark.itemId}`);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      await removeBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.itemId !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <BookmarkCheck size={64} color={Colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: Colors.text }]}>No Bookmarks Yet</Text>
      <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
        Bookmark files and folders to access them quickly from here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
        <View>
          <Text style={[styles.title, { color: Colors.primary }]}>Bookmarks</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
            {bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 
              <List size={20} color={Colors.primary} /> : 
              <Grid size={20} color={Colors.primary} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Bookmarks List */}
      <View style={styles.content}>
        {bookmarks.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookmarkItem
                bookmark={item}
                onPress={() => handleBookmarkPress(item)}
                onRemove={() => handleRemoveBookmark(item.itemId)}
                viewMode={viewMode}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode} // Force re-render when view mode changes
            contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : undefined}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
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
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  gridContainer: {
    padding: 8,
  },
  gridItem: {
    width: '48%',
    padding: 16,
    margin: 4,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 32,
  },
  gridSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: 8,
  },
  gridRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
