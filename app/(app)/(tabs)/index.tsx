import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { FileText, Star, Users, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/font';
import { router } from 'expo-router';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import { Folder } from '@/types';
import { useFetchAdminDashboard } from '@/hooks/useFetchAdminDashboard';
import DashboardStat from '@/components/admin/DashboardStat';
import DocumentsPageSkeleton from '@/components/skeleton/DocumentsPageSkeleton';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL, ADMIN_API_URL, UPLOAD_TIMEOUT } from '@/constants/api';

export default function HomeScreen() {
  const { user } = useAuth();
  const colors = Colors;

  // --- Non-admin state ---
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { folders, rootFolders, documents, isLoading, reload } = useFetchFolders(currentFolderId);

  useEffect(() => {
    if (user && user.role === 'admin') {
      setCurrentFolderId(null);
    }
  }, [user]);

  const openFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
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

  const navigateToParent = () => {
    if (!currentFolderId) return;
    const currentFolder = folders.find(f => f.id === currentFolderId);
    if (currentFolder?.parentId) {
      setCurrentFolderId(currentFolder.parentId);
    } else {
      setCurrentFolderId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
  );

  const renderEmptyComponent = (message: string) => (
    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{message}</Text>
  );

  // --- Admin View ---
  if (user?.role === 'admin') {
    const { dashboardData, isLoading, error } = useFetchAdminDashboard();
    const [excelFile, setExcelFile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    // Pick Excel/CSV file
    const pickExcelFile = async () => {
      try {
        const result = await (Platform.OS === 'web'
          ? new Promise<any>((resolve) => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls,.csv';
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  resolve({ name: file.name, fileObj: file });
                } else {
                  resolve(null);
                }
              };
              input.click();
            })
          : DocumentPicker.getDocumentAsync({ 
              type: [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv'
              ],
              multiple: false
            })
        );
        if (result && !result.canceled && (result.fileObj || (result.assets && result.assets[0]))) {
          const file = result.fileObj || result.assets[0];
          
          // Validate file type
          const fileName = file.name || '';
          const isValidFile = fileName.endsWith('.xlsx') || 
                            fileName.endsWith('.xls') || 
                            fileName.endsWith('.csv');
          
          if (!isValidFile) {
            Alert.alert('Invalid File', 'Please select an Excel file (.xlsx, .xls) or CSV file (.csv)');
            return;
          }
          
          setExcelFile(file);
          setUploadResult(null);
        }
      } catch (err: unknown) {
        console.error('File picker error:', err);
        Alert.alert('Error', 'Failed to pick file');
      }
    };

    // Upload Excel file
    const handleUploadExcel = async () => {
      if (!excelFile) return;
      setUploading(true);
      setUploadResult(null);
      try {
        // Get the stored token
        const getToken = async (): Promise<string | null> => {
          if (Platform.OS === 'web') {
            return localStorage.getItem('auth_token');
          } else {
            const SecureStore = await import('expo-secure-store');
            return await SecureStore.getItemAsync('auth_token');
          }
        };

        const token = await getToken();
        
        if (!token) {
          setUploadResult({ error: 'Authentication required. Please sign in again.', errors: [] });
          return;
        }

        const formData = new FormData();
        
        // Handle file upload for different platforms
        if (Platform.OS === 'web') {
          formData.append('file', excelFile, excelFile.name);
        } else {
          // For mobile platforms, ensure proper file type detection
          const fileType = excelFile.name?.endsWith('.csv') 
            ? 'text/csv' 
            : excelFile.name?.endsWith('.xlsx')
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/vnd.ms-excel';
            
          formData.append('file', {
            uri: excelFile.uri,
            name: excelFile.name,
            type: fileType,
          } as any);
        }

        console.log('Uploading file:', excelFile.name);
        console.log('API URL:', `${ADMIN_API_URL}/users/import`);
        
        // Add timeout and better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT); // Use upload timeout
        
        const response = await fetch(`${ADMIN_API_URL}/users/import`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - let the browser/platform set it with boundary
          },
          signal: controller.signal, // Add abort signal for timeout
        });
        
        clearTimeout(timeoutId); // Clear timeout if request completes
        
        console.log('Response status:', response.status);
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setUploadResult({ 
            error: `Server responded with invalid JSON. Status: ${response.status}`, 
            errors: [responseText] 
          });
          return;
        }
        
        if (!response.ok) {
          console.error('Upload failed with status:', response.status, data);
          setUploadResult({ 
            error: data.error || `Upload failed with status ${response.status}`, 
            errors: data.errors || [] 
          });
        } else {
          console.log('Upload successful:', data);
          setUploadResult(data.results || data);
          setExcelFile(null);
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        
        if (err.name === 'AbortError') {
          setUploadResult({ 
            error: 'Upload timed out after 30 seconds. Please try again with a smaller file.', 
            errors: [] 
          });
        } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          setUploadResult({ 
            error: 'Network error - please check your internet connection and server status', 
            errors: [`Server URL: ${API_BASE_URL}`] 
          });
        } else {
          setUploadResult({ 
            error: err.message || 'Upload failed - please try again', 
            errors: [] 
          });
        }
      } finally {
        setUploading(false);
      }
    };

    if (isLoading) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error || !dashboardData) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.error }}>Failed to load dashboard.</Text>
          <Text style={{ color: colors.textSecondary }}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.greeting, { color: colors.primary, marginTop:50 }]}>Admin Dashboard</Text>
              <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Welcome, {user?.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity>
                <Image 
                  source={{ uri: user?.avatar || '/avatar.jpg' }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 15, marginLeft: 16, marginBottom: 8 }]}>User Activity Overview</Text>
            <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
              <DashboardStat
                label="Active Users"
                value={dashboardData.userActivity.activeUsers.currentWeek}
                comparisonValue={dashboardData.userActivity.activeUsers.lastWeek}
                percentageChange={dashboardData.userActivity.activeUsers.percentageChange}
                isLoading={isLoading}
              />
              <DashboardStat
                label="Document Views"
                value={dashboardData.userActivity.documentAccess.currentWeek}
                comparisonValue={dashboardData.userActivity.documentAccess.lastWeek}
                percentageChange={dashboardData.userActivity.documentAccess.percentageChange}
                isLoading={isLoading}
              />
            </View>
            <View style={{ flexDirection: 'row', paddingHorizontal: 8, marginTop: 16 }}>
              <DashboardStat
                label="Time Spent (min)"
                value={dashboardData.userActivity.timeSpent.currentWeek}
                comparisonValue={dashboardData.userActivity.timeSpent.lastWeek}
                percentageChange={dashboardData.userActivity.timeSpent.percentageChange}
                isLoading={isLoading}
              />
               <View style={{flex: 1, marginHorizontal: 8}} />
            </View>
          </View>

          {/* Admin Excel Upload Section */}
          <View style={[styles.uploadSection, { backgroundColor: colors.surface, borderRadius: 12, marginHorizontal: 16, marginTop: 30, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>  
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Upload Employee List</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 15, marginTop: 10 }}>
              Upload an Excel file (.xlsx) with columns <Text style={{ fontWeight: 'bold', fontFamily: typography.bold }}>fullname</Text> and <Text style={{ fontWeight: 'bold', fontFamily: typography.bold }}>email</Text>.
              {'\n'}Employees not in the new list will be revoked, and new ones will be granted access automatically.
            </Text>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary, marginBottom: 8 }]}
              onPress={pickExcelFile}
              disabled={uploading}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{excelFile ? excelFile.name : 'Select Excel/CSV File'}</Text>
            </TouchableOpacity>
            
            <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                File must contain columns: <Text style={{ fontWeight: '600' }}>fullname</Text>, <Text style={{ fontWeight: '600' }}>email</Text>, and <Text style={{ fontWeight: '600' }}>ad-id</Text>
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                Supported formats: .xlsx, .xls, .csv
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary }]} 
              onPress={handleUploadExcel}
              disabled={!excelFile || uploading}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{uploading ? 'Uploading...' : 'Upload'}</Text>
            </TouchableOpacity>
            {uploadResult && (
              <View style={{ marginTop: 10 }}>
                {uploadResult.error ? (
                  <Text style={{ color: colors.error, fontWeight: '600' }}>{uploadResult.error}</Text>
                ) : (
                  <>
                    <Text style={{ color: colors.success || '#34A853', fontWeight: '600' }}>
                      New Employees Added: {uploadResult.newEmployeesAdded || 0}
                    </Text>
                    <Text style={{ color: colors.error, fontWeight: '600' }}>
                      Former Employees Removed: {uploadResult.formerEmployeesRemoved || 0}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                      Unchanged Employees: {uploadResult.unchangedEmployees || 0}
                    </Text>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ color: colors.error, fontWeight: '600' }}>Errors:</Text>
                        {uploadResult.errors.map((err: string, idx: number) => (
                          <Text key={idx} style={{ color: colors.error, fontSize: 12 }}>{err}</Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- Non-Admin View ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>    
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <View style={styles.headerLeft}>
          {currentFolderId && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={navigateToParent}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.greeting, { color: colors.primary, marginTop:50 }]}>Hi, {user?.name}</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity>
            <Image 
              source={{ uri: user?.avatar || '/avatar.jpg' }}
              style={styles.avatar}
            />
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

      <View style={[styles.content, { backgroundColor: colors.surface, borderRadius: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}> 
        <View style={styles.documentsContainer}>
          {isLoading ? (
            <DocumentsPageSkeleton viewMode="list" />
          ) : currentFolderId ? (
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
            >
              <View>
                {renderSectionHeader("Folders")}
                <FlatList
                  data={rootFolders}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <FolderItem folder={item} onPress={() => openFolder(item)} onUpdate={handleRefresh} viewMode="list" />
                  )}
                  ListEmptyComponent={() => renderEmptyComponent("No folders")}
                  scrollEnabled={false}
                />
              </View>
              <View style={{marginBottom: 32, marginTop: 32}}>
                {renderSectionHeader("Documents")}
                <FlatList
                  data={documents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <DocumentItem document={item} viewMode="list" onPress={() => router.push(`/document/${item.id}`)} onUpdate={handleRefresh} />
                  )}
                  ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          ) : (
            <FlatList
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
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
                          <FolderItem folder={item} onPress={() => openFolder(item)} onUpdate={handleRefresh} viewMode="list" />
                        )}
                        scrollEnabled={false}
                      />
                    </View>
                  );
                }
                if (item.id === 'documents') {
                  return (
                    <View style={{marginBottom: 32}}>
                      <Text style={[styles.documentTitle, { color: colors.primary }]}>Documents</Text>
                      <FlatList
                        data={documents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <DocumentItem document={item} viewMode="list" onPress={() => router.push(`/document/${item.id}`)} onUpdate={handleRefresh} />
                        )}
                        ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
                        scrollEnabled={false}
                      />
                    </View>
                  );
                }
                return null;
              }}
              contentContainerStyle={{paddingBottom: 32}}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: typography.bold,
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: typography.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: typography.bold,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.primary,
  },
  section: {
    marginTop: 24,
  },
  uploadSection: {
    marginTop: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: typography.bold,
  },
  content: {
    flex: 1,
  },
  documentsContainer: {
    flex: 1,
    padding: 16,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
  uploadBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});