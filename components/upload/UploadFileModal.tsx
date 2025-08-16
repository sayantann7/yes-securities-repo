import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform, TextInput, Image, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ChevronLeft, FilePlus, ImageIcon } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import { createFolder } from '@/services/folderService';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import DocumentItem from '@/components/document/DocumentItem';
import FolderItem from '@/components/document/FolderItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import IconPicker from './IconPicker';
import { API_BASE_URL } from '@/constants/api';

// Use environment variable for API URL
const API_URL = `${API_BASE_URL}/api`;

interface UploadFileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UploadFileModal({ visible, onClose }: UploadFileModalProps) {
  const { user } = useAuth();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  // include fileObj for web file blobs
  const [selectedFiles, setSelectedFiles] = useState<Array<{ uri: string; name: string; mimeType?: string; fileObj?: Blob; customIcon?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedFolderIcon, setSelectedFolderIcon] = useState<string | null>(null);
  const [showFileIconPicker, setShowFileIconPicker] = useState(false);
  const [selectedFileForIcon, setSelectedFileForIcon] = useState<number | null>(null);

  const { folders, rootFolders, documents, isLoading, reload } = useFetchFolders(currentFolderId);

  // Helper to format a single path segment to title case
  const formatSegmentName = (segment: string): string => {
    if (!segment) return 'Root';
    return segment
      .split('-')
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ') || 'Root';
  };

  // Build breadcrumb path from the currentFolderId prefix, mirroring Documents screen
  const getFolderPath = (): { id: string; name: string }[] => {
    if (!currentFolderId) return [];
    const trimmed = currentFolderId.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!trimmed) return [];
    const parts = trimmed.split('/');
    let acc = '';
    return parts.map((part) => {
      acc += part + '/';
      return { id: acc, name: formatSegmentName(part) };
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      console.log('🔄 Creating folder with icon:', { 
        folderName: newFolderName.trim(), 
        hasIcon: !!selectedFolderIcon 
      });
      
      await createFolder(currentFolderId, newFolderName.trim(), selectedFolderIcon || undefined);
      setCreatingFolder(false);
      setNewFolderName('');
      setSelectedFolderIcon(null);
      reload();
      
      console.log('✅ Folder creation completed successfully');
    } catch (err) {
      console.error('❌ Create folder failed:', err);
      
      // Show specific error message to user
      Alert.alert(
        'Folder Creation Error',
        `Failed to create folder: ${err instanceof Error ? err.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
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

        // First upload the file
        const resp = await fetch(`${API_URL}/files/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, contentType: file.mimeType || 'application/octet-stream' }),
        });
        const { url: signedUrl } = await resp.json();

        // use blob from fileObj if provided (web), otherwise fetch by uri
        const contentType = file.mimeType || 'application/octet-stream';
        if (Platform.OS === 'web') {
          // Web: use fetch + Blob body
          const blob = file.fileObj ? file.fileObj : await fetch(file.uri).then(r => r.blob());
          const headers: Record<string, string> = { 'Content-Type': contentType };
          if (typeof window !== 'undefined' && 'size' in blob && typeof (blob as any).size === 'number') {
            headers['Content-Length'] = String((blob as any).size);
          }
          const putOnce = async () => fetch(signedUrl, { method: 'PUT', headers, body: blob });
          let putRes = await putOnce();
          if (!putRes.ok) {
            await new Promise(r => setTimeout(r, 500));
            putRes = await putOnce();
          }
          if (!putRes.ok) {
            const text = await putRes.text();
            throw new Error(`Upload failed: ${putRes.status} ${text}`);
          }
        } else {
          // Native (iOS/Android): use FileSystem.uploadAsync for local file URIs
          if (!file.uri) throw new Error('Missing file URI for native upload');
          const result = await FileSystem.uploadAsync(signedUrl, file.uri, {
            httpMethod: 'PUT',
            headers: { 'Content-Type': contentType },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          });
          if (result.status < 200 || result.status >= 300) {
            throw new Error(`Upload failed: ${result.status} ${result.body?.slice(0, 200)}`);
          }
        }

        // If file has custom icon, upload it
        if (file.customIcon) {
          try {
            console.log('🖼️ Uploading custom icon for file:', file.name);
            
            // Get the file extension from the icon URI
            const extension = file.customIcon.split('.').pop()?.toLowerCase() || 'jpeg';
            console.log('📄 Icon extension detected:', extension);
            
            // Get authentication token
            const token = await getToken();
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Get signed URL for icon upload
            console.log('📡 Requesting icon upload URL for:', key);
            const iconResp = await fetch(`${API_URL}/icons/upload`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ itemPath: key, iconType: extension }),
            });
            
            if (!iconResp.ok) {
              const iconError = await iconResp.text();
              throw new Error(`Failed to get icon upload URL: ${iconResp.status} ${iconError}`);
            }
            
            const { uploadUrl } = await iconResp.json();

            // Upload the icon image
            console.log('📤 Uploading icon to S3...');
            const iconBlob = await fetch(file.customIcon).then(r => r.blob());
            const iconUploadResp = await fetch(uploadUrl, { 
              method: 'PUT', 
              headers: { 'Content-Type': `image/${extension}` }, 
              body: iconBlob 
            });
            
            if (!iconUploadResp.ok) {
              const uploadError = await iconUploadResp.text();
              throw new Error(`S3 icon upload failed: ${iconUploadResp.status} ${uploadError}`);
            }
            
            console.log('✅ File icon uploaded successfully for:', file.name);
          } catch (iconError) {
            console.error('❌ Failed to upload icon for file:', file.name, iconError);
            // Continue with file upload even if icon fails
          }
        }
      }
      setSelectedFiles([]);
      
      // Send notification if admin uploaded files
      if (user?.role === 'admin' && selectedFiles.length > 0) {
        try {
          const folderPath = currentFolderId || 'Root';
          const fileNames = selectedFiles.map(f => f.name).join(', ');
          await notificationService.sendUploadNotification(fileNames, folderPath);
          console.log('Upload notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send upload notification:', notificationError);
          // Don't fail the upload if notification fails, but show a warning
          Alert.alert(
            'Upload Complete', 
            'Files uploaded successfully, but failed to send notifications to users.',
            [{ text: 'OK' }]
          );
        }
      }
      
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
      try {
        const msg = err instanceof Error ? err.message : String(err);
        Alert.alert('Upload Failed', msg);
      } catch {}
    } finally {
      setUploading(false);
    }
  };

  const handleFolderIconSelected = (iconUri: string) => {
    setSelectedFolderIcon(iconUri);
  };

  const handleFileIconSelected = (iconUri: string) => {
    if (selectedFileForIcon !== null) {
      setSelectedFiles(prev => prev.map((file, index) => 
        index === selectedFileForIcon ? { ...file, customIcon: iconUri } : file
      ));
    }
    setSelectedFileForIcon(null);
  };

  const openFileIconPicker = (fileIndex: number) => {
    setSelectedFileForIcon(fileIndex);
    setShowFileIconPicker(true);
  };

  const removeFileIcon = (fileIndex: number) => {
    setSelectedFiles(prev => prev.map((file, index) => 
      index === fileIndex ? { ...file, customIcon: undefined } : file
    ));
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
            <View style={styles.iconSelectorRow}>
              <TouchableOpacity 
                onPress={() => setShowIconPicker(true)}
                style={[styles.iconSelectorButton, { backgroundColor: Colors.primary }]}
              >
                <ImageIcon size={16} color="white" />
                <Text style={[styles.iconSelectorText, { color: 'white' }]}>
                  {selectedFolderIcon ? 'Change Icon' : 'Add Icon'}
                </Text>
              </TouchableOpacity>
              {selectedFolderIcon && (
                <View style={styles.selectedIconPreview}>
                  <Image source={{ uri: selectedFolderIcon }} style={styles.iconPreviewImage} />
                </View>
              )}
            </View>
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

         {/* Selected Files Section */}
         {selectedFiles.length > 0 && (
           <View style={styles.selectedFilesSection}>
             <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Selected Files</Text>
             <FlatList
               data={selectedFiles}
               keyExtractor={(item, index) => `${item.name}-${index}`}
               renderItem={({ item, index }) => (
                 <View style={[styles.selectedFileItem, { backgroundColor: Colors.surfaceVariant }]}>
                   <View style={styles.fileIconContainer}>
                     {item.customIcon ? (
                       <Image source={{ uri: item.customIcon }} style={styles.fileCustomIcon} />
                     ) : (
                       <FilePlus size={20} color={Colors.textSecondary} />
                     )}
                   </View>
                   <View style={styles.fileInfo}>
                     <Text style={[styles.fileName, { color: Colors.text }]} numberOfLines={1}>
                       {item.name}
                     </Text>
                     <Text style={[styles.fileSize, { color: Colors.textSecondary }]}>
                       {item.mimeType || 'Unknown type'}
                     </Text>
                   </View>
                   <TouchableOpacity 
                     onPress={() => openFileIconPicker(index)}
                     style={[styles.iconButton, { backgroundColor: Colors.primary }]}
                   >
                     <ImageIcon size={16} color="white" />
                   </TouchableOpacity>
                   {item.customIcon && (
                     <TouchableOpacity 
                       onPress={() => removeFileIcon(index)}
                       style={[styles.removeButton, { backgroundColor: Colors.error }]}
                     >
                       <Text style={styles.removeButtonText}>×</Text>
                     </TouchableOpacity>
                   )}
                 </View>
               )}
               scrollEnabled={false}
             />
           </View>
         )}

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

       {/* Icon Picker for Folders */}
       <IconPicker
         visible={showIconPicker}
         onClose={() => setShowIconPicker(false)}
         onIconSelected={handleFolderIconSelected}
         currentIcon={selectedFolderIcon || undefined}
       />

       {/* Icon Picker for Files */}
       <IconPicker
         visible={showFileIconPicker}
         onClose={() => setShowFileIconPicker(false)}
         onIconSelected={handleFileIconSelected}
         currentIcon={selectedFileForIcon !== null ? selectedFiles[selectedFileForIcon]?.customIcon : undefined}
       />
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
  // Selected files styles
  selectedFilesSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selectedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  fileCustomIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Icon selector styles
  iconSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  iconSelectorText: {
    fontSize: 12,
    marginLeft: 4,
  },
  selectedIconPreview: {
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
  },
  iconPreviewImage: {
    width: 32,
    height: 32,
  },
});
// Helper to get the current user's auth token (if available)
async function getToken(): Promise<string | null> {
  // Try to get token from AuthContext if available
  try {
    // Fallback: try to get from localStorage/sessionStorage (web)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      return token || null;
    }
    // Fallback: no token found
    return null;
  } catch {
    return null;
  }
}

