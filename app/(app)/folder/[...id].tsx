// filepath: app/(app)/folder/[...id].tsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ChevronLeft, Grid, List, Filter, ArrowUpDown } from 'lucide-react-native';
import { getFolderData, getFolders } from '@/services/folderService';
import { getDocuments } from '@/services/documentService';
import { Folder, Document } from '@/types';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import SortModal from '@/components/folder/SortModal';

export default function FolderScreen() {
  // id will be an array of path segments for nested folders
  const { id } = useLocalSearchParams<{ id: string[] }>();
  const folderId = Array.isArray(id) ? id.join('/') + '/' : '';

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
        const folderData = await getFolderData(folderId);
        setFolder(folderData);

        // Fetch subfolders and documents in this folder
        const subs = await getFolders(folderId);
        const docs = await getDocuments(folderId);
        setSubfolders(subs);
        setDocuments(docs);

        // Build breadcrumb path
        const path = await buildFolderPath(folderId);
        setFolderPath(path);
      } catch (error) {
        console.error('Error fetching folder data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolderData();
  }, [folderId]);

  const buildFolderPath = async (fid: string): Promise<Array<{ id: string; name: string }>> => {
    const segments = fid ? fid.split('/').filter(Boolean) : [];
    const path: Array<{ id: string; name: string }> = [];
    let cumulative = '';
    for (const seg of segments) {
      cumulative += seg + '/';
      const { name } = await getFolderData(cumulative);
      path.push({ id: cumulative, name });
    }
    return path;
  };

  const handleBack = () => {
    if (folderPath.length > 1) {
      const prev = folderPath[folderPath.length - 2].id;
      router.push(`/folder/${prev}`);
    } else {
      router.replace('/documents');
    }
  };

  const navigateToFolder = (f: Folder) => {
    router.push(`/folder/${f.id}`);
  };

  const handleOpenDocument = (d: Document) => {
    const encodedId = encodeURIComponent(d.id);
    router.push(`/document/${encodedId}`);
  };

  const navigateToRoot = () => {
    router.replace('/documents');
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortModal(false);
    // sorting logic unchanged...
    const sortedDocs = [...documents].sort((a, b) => {
      switch (option) {
        case 'nameAsc': return a.name.localeCompare(b.name);
        case 'nameDesc': return b.name.localeCompare(a.name);
        case 'dateAsc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'dateDesc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'typeAsc': return a.type.localeCompare(b.type);
        case 'typeDesc': return b.type.localeCompare(a.type);
        default: return 0;
      }
    });
    const sortedFolders = [...subfolders].sort((a, b) => a.name.localeCompare(b.name));
    setDocuments(sortedDocs);
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
          <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.actionButton}>
            <ArrowUpDown size={20} color="#0C2340" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Filter size={20} color="#0C2340" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.actionButton}>
            {viewMode === 'grid' ? <List size={20} color="#0C2340" /> : <Grid size={20} color="#0C2340" />}
          </TouchableOpacity>
        </View>
      </View>
      <BreadcrumbNav
        path={folderPath}
        onHomePress={navigateToRoot}
        onItemPress={(folderId: string) => router.push(`/folder/${folderId}`)}
      />
      <View style={styles.content}>
        {subfolders.length > 0 && (
          <>  
            <Text style={styles.sectionTitle}>Folders</Text>
            <FlatList
              data={subfolders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <FolderItem folder={item} onPress={() => navigateToFolder(item)} />}
              horizontal={viewMode === 'grid'}
              style={styles.list}
            />
          </>
        )}
        {documents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Documents</Text>
            <FlatList
              data={documents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <DocumentItem document={item} viewMode={viewMode} onPress={() => handleOpenDocument(item)} />}              
              horizontal={viewMode === 'grid'}
              style={styles.list}
            />
          </>
        )}
        {!isLoading && subfolders.length === 0 && documents.length === 0 && (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>This folder is empty</Text></View>
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
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  backBtn: { padding: 8 },
  titleContainer: { flex: 1, marginLeft: 8 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2340',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    fontWeight: '500',
    color: '#0C2340',
    marginBottom: 8,
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  // ...rest of styles unchanged
});
