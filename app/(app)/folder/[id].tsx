import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronLeft, Grid, List, Filter, ArrowUpDown } from 'lucide-react-native';
import { getFolderData, getFolderById, getFolders } from '@/services/folderService';
import { getDocuments } from '@/services/documentService';
import { Folder, Document } from '@/types';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import SortModal from '@/components/folder/SortModal';
import { Colors } from '@/constants/Colors';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState<string>('nameAsc');
  
  useEffect(() => {
    const fetchFolderData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the current folder details
        const folderData = await getFolderData(id);
        setFolder(folderData);
        
        // Fetch subfolders in this folder
        const subfoldersList = await getFolders(id);
        console.log('Fetched subfolders:', subfoldersList);
        setSubfolders(subfoldersList);
        
        // Fetch documents in this folder
        const documentsList = await getDocuments(id);
        console.log('Fetched documents:', documentsList);
        setDocuments(documentsList);
        
        // Build folder path
        const path = await buildFolderPath(id);
        setFolderPath(path);
      } catch (error) {
        console.error('Error fetching folder data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchFolderData();
    }
  }, [id]);
  
  const buildFolderPath = async (folderId: string): Promise<Array<{ id: string; name: string }>> => {
    // This would fetch the complete path to the folder
    const folder = await getFolderById(folderId);
    const path = [{ id: folder.id, name: folder.name }];
    
    if (folder.parentId) {
      const parentPath = await buildFolderPath(folder.parentId);
      return [...parentPath, ...path];
    }
    
    return path;
  };
  
  const handleBack = () => {
    if (folder?.parentId) {
      router.push(`/folder/${folder.parentId}`);
    } else {
      router.back();
    }
  };
  
  const handleOpenFolder = (folder: Folder) => {
    router.push(`/folder/${folder.id}`);
  };
  
  const handleOpenDocument = (document: Document) => {
    // Encode the document ID to preserve slashes in the URL
    const encodedId = encodeURIComponent(document.id);
    router.push(`/document/${encodedId}`);
  };
  
  const navigateToRoot = () => {
    router.replace('/documents');
  };
  
  const navigateToFolder = (folderId: string) => {
    router.push(`/folder/${folderId}`);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortModal(false);
    
    // Sort documents and folders based on the selected option
    const sortedDocuments = [...documents].sort((a, b) => {
      switch (option) {
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateAsc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'dateDesc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'typeAsc':
          return a.type.localeCompare(b.type);
        case 'typeDesc':
          return b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });
    
    const sortedFolders = [...subfolders].sort((a, b) => {
      switch (option) {
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateAsc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'dateDesc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    
    setDocuments(sortedDocuments);
    setSubfolders(sortedFolders);
  };

  const handleRefresh = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch the current folder details
      const folderData = await getFolderData(id);
      setFolder(folderData);
      
      // Fetch subfolders in this folder
      const subfoldersList = await getFolders(id);
      setSubfolders(subfoldersList);
      
      // Fetch documents in this folder
      const documentsList = await getDocuments(id);
      setDocuments(documentsList);
      
      // Build folder path
      const path = await buildFolderPath(id);
      setFolderPath(path);
    } catch (error) {
      console.error('Error refreshing folder data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: Colors.primary }]} numberOfLines={1}>{folder?.name || 'Loading...'}</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
            {subfolders.length} folders • {documents.length} documents
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowSortModal(true)}
          >
            <ArrowUpDown size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Filter size={20} color={Colors.primary} />
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
      
      <BreadcrumbNav 
        path={folderPath} 
        onHomePress={navigateToRoot}
        onItemPress={navigateToFolder}
      />
      
      <View style={[styles.content, { backgroundColor: Colors.surface, borderRadius: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
        {subfolders.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Folders</Text>
            <FlatList
              data={subfolders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FolderItem folder={item} onPress={() => handleOpenFolder(item)} onUpdate={handleRefresh} />
              )}
              horizontal={viewMode === 'grid'}
              numColumns={viewMode === 'grid' ? 1 : undefined}
              style={styles.list}
            />
          </>
        )}
        
        {documents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Documents</Text>
            <FlatList
              data={documents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DocumentItem 
                  document={item} 
                  viewMode={viewMode} 
                  onPress={() => handleOpenDocument(item)}
                  onUpdate={handleRefresh}
                />
              )}
              horizontal={viewMode === 'grid'}
              numColumns={viewMode === 'grid' ? 1 : undefined}
              style={styles.list}
            />
          </>
        )}
        
        {subfolders.length === 0 && documents.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>This folder is empty</Text>
          </View>
        )}
      </View>
      
      <SortModal 
        visible={showSortModal} 
        onClose={() => setShowSortModal(false)}
        onSelect={handleSortChange}
        currentSort={sortOption}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  },
  subtitle: {
    fontSize: 12,
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7A869A',
    textAlign: 'center',
  },
});