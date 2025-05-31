import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ChevronLeft, FilePlus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import DocumentItem from '@/components/document/DocumentItem';
import FolderItem from '@/components/document/FolderItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';

// Adjust API_URL as needed
const API_URL = 'http://192.168.1.34:3000/api';

interface UploadFileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UploadFileModal({ visible, onClose }: UploadFileModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const { folders, rootFolders, documents, isLoading } = useFetchFolders(currentFolderId);

  const getFolderPath = (): { id: string; name: string }[] => {
    if (!currentFolderId) return [];
    const path: { id: string; name: string }[] = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      if (!current.parentId) break;
      current = folders.find(f => f.id === current?.parentId);
      if (!current) break;
    }
    return path;
  };

  const handleFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      // Construct key with folder
      const prefix = currentFolderId ? (currentFolderId.endsWith('/') ? currentFolderId : `${currentFolderId}/`) : '';
      const key = `${prefix}${selectedFile.name}`;

      // Get signed URL
      const resp = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key, 
          contentType: selectedFile.mimeType || 'application/octet-stream' 
        }),
      });
      const { url: signedUrl } = await resp.json();

      // Fetch file and upload to signed URL
      const fileBlob = await fetch(selectedFile.uri).then(r => r.blob());
      const uploadHeaders = new Headers();
      uploadHeaders.append('Content-Type', selectedFile.mimeType || 'application/octet-stream');
      
      const res = await fetch(signedUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: fileBlob,
      });
      console.log('Upload response:', res);
      // Close modal
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Upload File</Text>
        </View>

        {/* Breadcrumb navigation */}
        {getFolderPath().length > 0 && (
          <BreadcrumbNav
            path={getFolderPath()}
            onHomePress={() => setCurrentFolderId(null)}
            onItemPress={id => setCurrentFolderId(id)}
          />
        )}

        <View style={styles.listContainer}>
          {/* Folders Section */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Folders</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (currentFolderId ? folders.filter(f => f.parentId === currentFolderId) : rootFolders).length > 0 ? (
            <FlatList
              data={currentFolderId ? folders.filter(f => f.parentId === currentFolderId) : rootFolders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <FolderItem folder={item} onPress={() => setCurrentFolderId(item.id)} />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No folders</Text>
          )}
          {/* Documents Section */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Documents</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : documents.length > 0 ? (
            <FlatList
              data={documents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <DocumentItem document={item} viewMode="list" />
              )}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No documents</Text>
          )}
         </View>

         <View style={styles.actions}>          
           <TouchableOpacity onPress={handleFilePick} style={[styles.pickBtn, { backgroundColor: colors.primary }]}>            
             <FilePlus size={20} color="#fff" />
             <Text style={styles.pickText}>{selectedFile?.name || 'Select File'}</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={handleUpload} disabled={!selectedFile || uploading} style={[styles.uploadBtn, { backgroundColor: colors.primary }]}>          
             {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>Upload</Text>}
           </TouchableOpacity>
         </View>
       </View>
     </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', marginLeft: 8 },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8 },
  pickText: { color: '#fff', marginLeft: 8, fontWeight: '500' },
  uploadBtn: { padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 100 },
  uploadText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', padding: 16 },
});
