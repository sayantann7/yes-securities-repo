import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router, Redirect } from 'expo-router';
import { ChevronRight, ChevronDown, FolderOpen, Plus, Grid, List } from 'lucide-react-native';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import { Folder } from '@/types';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import UploadFileModal from '@/components/upload/UploadFileModal';
import DocumentsPageSkeleton from '@/components/skeleton/DocumentsPageSkeleton';

const TAB_BAR_HEIGHT = 64;
const BOTTOM_SPACING = Platform.OS === 'ios' ? 24 : 16;
const SAFE_AREA_BOTTOM = 20;
const TOTAL_BOTTOM_SPACING = TAB_BAR_HEIGHT + BOTTOM_SPACING + SAFE_AREA_BOTTOM;

export default function DocumentsScreen() {
  const { user } = useAuth();

  // Redirect non-admin users to home page
  if (user?.role !== 'admin') {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [bottomRefreshing, setBottomRefreshing] = useState(false);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const { folders, rootFolders, documents, isLoading, reload } = useFetchFolders(currentFolderId);



  const toggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const openFolder = (folder: Folder) => {
    // Add current folder to history before navigating
    if (currentFolderId) {
      setFolderHistory(prev => [...prev, currentFolderId]);
    }
    setCurrentFolderId(folder.id);
    // router.push(`/folder/${folder.id}`); // Removed to keep navigation within tab
  };

  const getFolderPath = (): { id: string; name: string }[] => {
    if (!currentFolderId) return [];
    const path: { id: string; name: string }[] = [];
    let currentFolder = folders.find(f => f.id === currentFolderId);
    while (currentFolder) {
      path.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (!currentFolder.parentId) break;
      currentFolder = folders.find(f => f.id === currentFolder?.parentId);
      if (!currentFolder) break;
    }
    return path;
  };

  const navigateToRoot = () => {
    setCurrentFolderId(null);
  };

  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const navigateToHome = () => {
    setCurrentFolderId(null);
    setFolderHistory([]); // Clear folder history when going home
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBottomRefresh = async () => {
    if (isLoading || bottomRefreshing) return; // Prevent multiple simultaneous refreshes
    setBottomRefreshing(true);
    try {
      await reload();
    } finally {
      setBottomRefreshing(false);
    }
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: Colors.primary }]}>{title}</Text>
  );

  const renderEmptyComponent = (message: string) => (
    <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>{message}</Text>
  );

  const renderFooter = () => {
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>    
      <View style={[styles.header, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}> 
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: Colors.primary }]}>
              {currentFolderId ? 
                (folders.find(f => f.id === currentFolderId)?.name || 'Folder') : 
                'Documents'
              }
            </Text>
            {currentFolderId && (
              <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                {getFolderPath().length} level{getFolderPath().length !== 1 ? 's' : ''} deep
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.viewToggleButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? 
              <Grid size={20} color={Colors.primary} /> : 
              <List size={20} color={Colors.primary} />
            }
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ backgroundColor: Colors.primary, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}
            onPress={() => setShowUploadModal(true)}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {currentFolderId && (
        <BreadcrumbNav 
          path={getFolderPath()} 
          onHomePress={navigateToRoot}
          onItemPress={navigateToFolder}
        />
      )}

      <View style={[styles.content, { backgroundColor: Colors.surface, borderRadius: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}> 
        <View style={styles.documentsContainer}>
          {isLoading ? (
            <DocumentsPageSkeleton viewMode={viewMode} />
          ) : currentFolderId ? (
            // Current folder view
            <FlatList
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              data={[{id: 'folders'}, {id: 'documents'}]}
              keyExtractor={(item) => item.id}
              onEndReached={handleBottomRefresh}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              renderItem={({item}) => {
                if (item.id === 'folders') {
                  return (
                    <View>
                      {renderSectionHeader("Folders")}
                      <FlatList
                        data={rootFolders}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <FolderItem folder={item} onPress={() => openFolder(item)} onUpdate={handleRefresh} viewMode={viewMode} />
                        )}
                        ListEmptyComponent={() => renderEmptyComponent("No folders")}
                        scrollEnabled={false}
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        key={viewMode} // Force re-render when view mode changes
                      />
                    </View>
                  );
                }
                if (item.id === 'documents') {
                  return (
                    <View style={{marginBottom: TOTAL_BOTTOM_SPACING}}>
                      {renderSectionHeader("Documents")}
                      <FlatList
                        data={documents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <DocumentItem document={item} viewMode={viewMode} onPress={() => router.push(`/document/${item.id}`)} onUpdate={handleRefresh} />
                        )}
                        ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        key={`documents-${viewMode}`} // Force re-render when view mode changes
                        scrollEnabled={false}
                      />
                    </View>
                  );
                }
                return null;
              }}
              contentContainerStyle={{paddingBottom: TOTAL_BOTTOM_SPACING}}
            />
          ) : (
            // Root view
            <FlatList
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              data={[{id: 'folders'}, {id: 'documents'}]}
              keyExtractor={(item) => item.id}
              onEndReached={handleBottomRefresh}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              renderItem={({item}) => {
                if (item.id === 'folders') {
                  return (
                    <View>
                      {renderSectionHeader("All Folders")}
                      <FlatList
                        data={rootFolders}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <FolderItem folder={item} onPress={() => openFolder(item)} onUpdate={handleRefresh} viewMode={viewMode} />
                        )}
                        scrollEnabled={false}
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        key={`folders-${viewMode}`} // Force re-render when view mode changes
                      />
                    </View>
                  );
                }
                if (item.id === 'documents') {
                  return (
                    <View style={{marginBottom: TOTAL_BOTTOM_SPACING}}>
                      {renderSectionHeader("Documents")}
                      <FlatList
                        data={documents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <DocumentItem document={item} viewMode={viewMode} onPress={() => router.push(`/document/${item.id}`)} onUpdate={handleRefresh} />
                        )}
                        ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        key={`root-documents-${viewMode}`} // Force re-render when view mode changes
                        scrollEnabled={false}
                      />
                    </View>
                  );
                }
                return null;
              }}
              contentContainerStyle={{paddingBottom: TOTAL_BOTTOM_SPACING}}
            />
          )}
        </View>
      </View>
      
      <UploadFileModal 
        visible={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  expandButton: {
    padding: 4,
  },
  folderIcon: {
    marginRight: 8,
  },
  folderName: {
    fontSize: 14,
    flex: 1,
  },
  documentsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 12,
  },
}); 