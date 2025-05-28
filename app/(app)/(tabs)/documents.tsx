import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ChevronRight, ChevronDown, FolderOpen, File, FilePlus, Grid, List } from 'lucide-react-native';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import { Folder } from '@/types';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';

export default function DocumentsScreen() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { folders, rootFolders, documents, isLoading } = useFetchFolders(currentFolderId);
  
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              viewMode === 'grid' && styles.viewToggleButtonActive
            ]} 
            onPress={() => setViewMode('grid')}
          >
            <Grid size={20} color={viewMode === 'grid' ? '#1A5F7A' : '#94A3B8'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              viewMode === 'list' && styles.viewToggleButtonActive
            ]} 
            onPress={() => setViewMode('list')}
          >
            <List size={20} color={viewMode === 'list' ? '#1A5F7A' : '#94A3B8'} />
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
      
      <View style={styles.content}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Folders</Text>
          <ScrollView style={styles.folderTree}>
            {renderFolderTree()}
          </ScrollView>
          
          <TouchableOpacity style={styles.addButton}>
            <FilePlus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.documentsContainer}>
          {currentFolderId ? (
            <>
              <Text style={styles.sectionTitle}>Folders</Text>
              <FlatList
                data={folders.filter(f => f.parentId === currentFolderId)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <FolderItem folder={item} onPress={() => openFolder(item)} />
                )}
                horizontal={viewMode === 'grid'}
                numColumns={viewMode === 'grid' ? 1 : undefined}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No folders</Text>
                }
              />
              
              <Text style={styles.sectionTitle}>Documents</Text>
              <FlatList
                data={documents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <DocumentItem document={item} viewMode={viewMode} />
                )}
                horizontal={viewMode === 'grid'}
                numColumns={viewMode === 'grid' ? 1 : undefined}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No documents in this folder</Text>
                }
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>All Folders</Text>
              <FlatList
                data={rootFolders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <FolderItem folder={item} onPress={() => openFolder(item)} />
                )}
                horizontal={viewMode === 'grid'}
                numColumns={viewMode === 'grid' ? 1 : undefined}
              />
              
              <Text style={styles.sectionTitle}>Recent Documents</Text>
              <FlatList
                data={documents.slice(0, 5)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <DocumentItem document={item} viewMode={viewMode} />
                )}
                horizontal={viewMode === 'grid'}
                numColumns={viewMode === 'grid' ? 1 : undefined}
              />
            </>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A5F7A',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 12,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A5F7A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  folderTree: {
    flex: 1,
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
    color: '#1A5F7A',
    marginBottom: 12,
    marginTop: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 12,
  },
  addButton: {
    backgroundColor: '#1A5F7A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});