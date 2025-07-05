import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { FileText, Star, Users } from 'lucide-react-native';
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
import * as DocumentPicker from 'expo-document-picker';

export default function HomeScreen() {
  const { user } = useAuth();
  const colors = Colors;

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  // --- Non-admin state ---
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { folders, rootFolders, documents } = useFetchFolders(currentFolderId);

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

    // Pick Excel file
    const handlePickExcel = async () => {
      try {
        const result = await (Platform.OS === 'web'
          ? new Promise<any>((resolve) => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx';
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                resolve({ name: file.name, fileObj: file });
              };
              input.click();
            })
          : DocumentPicker.getDocumentAsync({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        );
        if (result && (result.fileObj || (result.assets && result.assets[0]))) {
          setExcelFile(result.fileObj || result.assets[0]);
          setUploadResult(null);
        }
      } catch (err: unknown) {
        Alert.alert('Error', 'Failed to pick file');
      }
    };

    // Upload Excel file
    const handleUploadExcel = async () => {
      if (!excelFile) return;
      setUploading(true);
      setUploadResult(null);
      try {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          formData.append('file', excelFile, excelFile.name);
        } else {
          formData.append('file', {
            uri: excelFile.uri,
            name: excelFile.name,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          } as any);
        }
        const response = await fetch(`${API_BASE_URL}/admin/users/import`, {
          method: 'POST',
          body: formData,
          headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
        });
        const data = await response.json();
        if (!response.ok) {
          setUploadResult({ error: data.error || 'Upload failed', errors: [] });
        } else {
          setUploadResult(data.results || data);
          setExcelFile(null);
        }
      } catch (err: any) {
        setUploadResult({ error: err.message || 'Upload failed', errors: [] });
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
              onPress={handlePickExcel}
              disabled={uploading}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{excelFile ? excelFile.name : 'Select Excel File'}</Text>
            </TouchableOpacity>
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
        <View>
          <Text style={[styles.greeting, { color: colors.primary, marginTop:50 }]}>Hi, {user?.name}</Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
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
          {currentFolderId ? (
            <View style={{flex: 1}}>
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
              <View style={{marginBottom: 32, marginTop: 32}}>
                {renderSectionHeader("Documents")}
                <FlatList
                  data={documents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <DocumentItem document={item} viewMode="list" onPress={() => router.push(`/document/${item.id}`)} />
                  )}
                  ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
                />
              </View>
            </View>
          ) : (
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
                }
                if (item.id === 'documents') {
                  return (
                    <View style={{marginBottom: 32}}>
                      <Text style={[styles.documentTitle, { color: colors.primary }]}>Documents</Text>
                      <FlatList
                        data={documents}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <DocumentItem document={item} viewMode="list" onPress={() => router.push(`/document/${item.id}`)} />
                        )}
                        ListEmptyComponent={() => renderEmptyComponent("No documents in this folder")}
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