import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ChevronRight, ChevronDown, FolderOpen, File, FilePlus } from 'lucide-react-native';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import { Folder } from '@/types';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';

// Define constants for bottom spacing
const TAB_BAR_HEIGHT = 64;
const BOTTOM_SPACING = Platform.OS === 'ios' ? 24 : 16;
const SAFE_AREA_BOTTOM = 20;
const TOTAL_BOTTOM_SPACING = TAB_BAR_HEIGHT + BOTTOM_SPACING + SAFE_AREA_BOTTOM;

export default function DocumentsScreen() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { folders, rootFolders, documents, isLoading } = useFetchFolders(currentFolderId);
  
  // All your existing functions remain the same
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
    setCurrentFolderId(folder.id);
    router.push(`/folder/${folder.id}`);
  };
  
  const getFolderPath = (): { id: string; name: string }[] => {
    if (!currentFolderId) return [];
    
    const path: { id: string; name: string }[] = [];
    let currentFolder = folders.find(f => f.id === currentFolderId);
    
    while (currentFolder) {
      path.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (!currentFolder.parentId) break;
      currentFolder = folders.find(f => f.id === currentFolder.parentId);
    }
    
    return path;
  };
  
  const navigateToRoot = () => {
    setCurrentFolderId(null);
  };
  
  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const renderFolderTree = (parentId: string | null = null, level = 0) => {
    const folderItems = folders.filter(f => f.parentId === parentId);
    
    return folderItems.map(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = folders.some(f => f.parentId === folder.id);
      
      return (
        <View key={folder.id}>
          <TouchableOpacity 
            style={[styles.folderRow, { paddingLeft: 16 + level * 16 }]}
            onPress={() => openFolder(folder)}
            onLongPress={() => toggleExpanded(folder.id)}
          >
            {hasChildren && (
              <TouchableOpacity 
                onPress={() => toggleExpanded(folder.id)}
                style={styles.expandButton}
              >
                {isExpanded ? 
                  <ChevronDown size={16} color="#94A3B8" /> : 
                  <ChevronRight size={16} color="#94A3B8" />
                }
              </TouchableOpacity>
            )}
            <FolderOpen size={20} color="#FBBC05" style={styles.folderIcon} />
            <Text style={styles.folderName}>{folder.name}</Text>
          </TouchableOpacity>
          
          {isExpanded && renderFolderTree(folder.id, level + 1)}
        </View>
      );
    });
  };

  // Render section headers
  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  // Render empty list component
  const renderEmptyComponent = (message: string) => (
    <Text style={styles.emptyText}>{message}</Text>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Documents</Text>
        </View>
      </View>
      
      {currentFolderId && (
        <BreadcrumbNav 
          path={getFolderPath()} 
          onHomePress={navigateToRoot}
          onItemPress={navigateToFolder}
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.documentsContainer}>
          {currentFolderId ? (
            // Current folder view
            <View style={{flex: 1}}>
              {/* Folders in current folder */}
              <View>
                {renderSectionHeader("Folders")}
                <FlatList
                  data={folders.filter(f => f.parentId === currentFolderId)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <FolderItem folder={item} onPress={() => openFolder(item)} />
                  )}
                  ListEmptyComponent={() => renderEmptyComponent("No folders")}
                  scrollEnabled={false}
                />
              </View>
              
              {/* Documents in current folder */}
              <View style={{marginBottom: TOTAL_BOTTOM_SPACING}}>
                {renderSectionHeader("Documents")}
                <FlatList
                  data={documents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <DocumentItem document={item} viewMode="list" />
                  )}
                  ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
                />
              </View>
            </View>
          ) : (
            // Root view
            <FlatList
              data={[{id: 'folders'}, {id: 'documents'}]}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => {
                if (item.id === 'folders') {
                  return (
                    <View>
                      {renderSectionHeader("All Folders")}
                      <FlatList
                        data={rootFolders}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <FolderItem folder={item} onPress={() => openFolder(item)} />
                        )}
                        scrollEnabled={false}
                      />
                    </View>
                  );
                } else {
                  return (
                    <View>
                      {renderSectionHeader("Recent Documents")}
                      <FlatList
                        data={documents.slice(0, 5)}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <DocumentItem document={item} viewMode="list" />
                        )}
                        scrollEnabled={false}
                      />
                    </View>
                  );
                }
              }}
              contentContainerStyle={{paddingBottom: TOTAL_BOTTOM_SPACING}}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C2340',
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
    color: '#334155',
    flex: 1,
  },
  documentsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C2340',
    marginBottom: 12,
    marginTop: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 12,
  },
});