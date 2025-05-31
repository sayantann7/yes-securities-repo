import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronLeft, Grid, List, Filter, ArrowUpDown } from 'lucide-react-native';
import { getFolderData, getFolderContents } from '@/services/folderService';
import { Folder, Document } from '@/types';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import SortModal from '@/components/folder/SortModal';

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
        
        // Fetch subfolders and documents in this folder
        const contents = await getFolderContents(id);
        setSubfolders(contents.folders);
        setDocuments(contents.files);
        
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
    router.push(`/document/${document.id}`);
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
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0C2340" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{folder?.name || 'Loading...'}</Text>
          <Text style={styles.subtitle}>
            {subfolders.length} folders • {documents.length} documents
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowSortModal(true)}
          >
            <ArrowUpDown size={20} color="#0C2340" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Filter size={20} color="#0C2340" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 
              <List size={20} color="#0C2340" /> : 
              <Grid size={20} color="#0C2340" />
            }
          </TouchableOpacity>
        </View>
      </View>
      
      <BreadcrumbNav 
        path={folderPath} 
        onHomePress={navigateToRoot}
        onItemPress={navigateToFolder}
      />
      
      <View style={styles.content}>
        {subfolders.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Folders</Text>
            <FlatList
              data={subfolders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FolderItem folder={item} onPress={() => handleOpenFolder(item)} />
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
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#0C2340',
  },
  subtitle: {
    fontSize: 12,
    color: '#7A869A',
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
    color: '#0C2340',
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