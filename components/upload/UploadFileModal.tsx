import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ChevronLeft, FilePlus } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import { createFolder } from '@/services/folderService';
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

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  // include fileObj for web file blobs
  const [selectedFiles, setSelectedFiles] = useState<Array<{ uri: string; name: string; mimeType?: string; fileObj?: Blob }>>([]);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { folders, rootFolders, documents, isLoading, reload } = useFetchFolders(currentFolderId);

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(currentFolderId, newFolderName.trim());
      setCreatingFolder(false);
      setNewFolderName('');
      reload();
    } catch (err) {
      console.error('Create folder failed:', err);
    }
  };

  const handleFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
    if (!result.canceled && result.assets) {
      setSelectedFiles(result.assets);
    }
  };

  const handleFolderPick = async () => {
    if (Platform.OS === 'android') {
      const res = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (res.granted && res.directoryUri) {
        const items = await FileSystem.StorageAccessFramework.readDirectoryAsync(res.directoryUri);
        const files = items
          .filter(name => name.includes('.'))
          .map(name => ({ uri: `${res.directoryUri}/${name}`, name, mimeType: undefined }));
        setSelectedFiles(prev => [...prev, ...files]);
      }
    } else if (Platform.OS === 'web') {
      // Web: use HTML input element for folder selection
      const inputPicker = document.createElement('input');
      inputPicker.type = 'file';
      inputPicker.multiple = true;
      inputPicker.setAttribute('webkitdirectory', '');
      inputPicker.setAttribute('directory', '');
      inputPicker.onchange = (event: any) => {
        const files = Array.from((event.target as HTMLInputElement).files || []);
        const mapped = files.map(f => ({
          uri: '',
          name: (f as any).webkitRelativePath || f.name,
          mimeType: f.type,
          fileObj: f,
        }));
        setSelectedFiles(prev => [...prev, ...mapped]);
      };
      inputPicker.click();
    } else {
      // iOS fallback: multi-file picker
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
      if (!result.canceled && result.assets) {
        setSelectedFiles(prev => [...prev, ...result.assets]);
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const prefix = currentFolderId ? (currentFolderId.endsWith('/') ? currentFolderId : `${currentFolderId}/`) : '';
      for (const file of selectedFiles) {
        const key = `${prefix}${file.name}`;

        const resp = await fetch(`${API_URL}/files/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, contentType: file.mimeType || 'application/octet-stream' }),
        });
        const { url: signedUrl } = await resp.json();

        // use blob from fileObj if provided (web), otherwise fetch by uri
        const blob = file.fileObj ? file.fileObj : await fetch(file.uri).then(r => r.blob());
        await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.mimeType || 'application/octet-stream' }, body: blob });
      }
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: Colors.surface }]}>        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ChevronLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors.primary }]}>Upload File</Text>
        </View>

        {/* Create Folder Input */}
        {creatingFolder && (
          <View style={[styles.createFolderContainer, { backgroundColor: Colors.surface }]}>            
            <TextInput
              placeholder="Folder Name"
              placeholderTextColor={Colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              style={[styles.input, { borderColor: Colors.textSecondary, color: Colors.textSecondary }]}
            />
            <View style={styles.createActions}>
              <TouchableOpacity onPress={() => setCreatingFolder(false)}>
                <Text style={[styles.createActionText, { color: Colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateFolder} disabled={!newFolderName.trim()}>
                <Text style={[styles.createActionText, { color: Colors.primary }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Folders</Text>
            <TouchableOpacity onPress={() => { setCreatingFolder(true); setNewFolderName(''); }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.primary }}>New Folder</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : rootFolders.length > 0 ? (
            <FlatList
              data={rootFolders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <FolderItem folder={item} onPress={() => setCurrentFolderId(item.id)} />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>No folders</Text>
          )}
          {/* Documents Section */}
          <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Documents</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : documents.length > 0 ? (
            <FlatList
              data={documents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <DocumentItem document={item} viewMode="list" />
              )}
            />
          ) : (
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>No documents</Text>
          )}
         </View>

         <View style={styles.actions}>
          {/* File/Folder upload actions */}
           <TouchableOpacity onPress={handleFolderPick} style={[styles.pickBtn, { backgroundColor: Colors.primary }]}>            
             <FilePlus size={20} color="#fff" />
             <Text style={styles.pickText}>Select Folder</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={handleFilePick} style={[styles.pickBtn, { backgroundColor: Colors.primary }]}>            
             <FilePlus size={20} color="#fff" />
             <Text style={styles.pickText}>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : 'Select File(s)'}</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={handleUpload} disabled={selectedFiles.length === 0 || uploading} style={[styles.uploadBtn, { backgroundColor: Colors.primary }]}>          
             {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>Upload</Text>}
           </TouchableOpacity>
         </View>
       </View>
     </Modal>
   );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  createFolderContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  createActionText: { fontSize: 14, fontWeight: '600', marginLeft: 16 },
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
