import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { FileText, Star, Users } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useFetchFolders } from '@/hooks/useFetchFolders';
import FolderItem from '@/components/document/FolderItem';
import DocumentItem from '@/components/document/DocumentItem';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import { Folder } from '@/types';
import { useFetchAdminDashboard } from '@/hooks/useFetchAdminDashboard';
import DashboardStat from '@/components/admin/DashboardStat';

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];

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
            <TouchableOpacity>
              <Image 
                source={{ uri: user?.avatar || '/avatar.jpg' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, marginLeft: 16, marginBottom: 8 }]}>User Activity Overview</Text>
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
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, marginLeft: 16, marginBottom: 8 }]}>Content Overview</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8 }}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
                  <FileText size={20} color="#4285F4" />
                </View>
                <Text style={[styles.statValue, { color: colors.primary }]}>{dashboardData.documentsCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Documents</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 188, 5, 0.1)' }]}>
                  <Star size={20} color="#FBBC05" />
                </View>
                <Text style={[styles.statValue, { color: colors.primary }]}>{dashboardData.starredCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Starred</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
                  <Users size={20} color="#34A853" />
                </View>
                <Text style={[styles.statValue, { color: colors.primary }]}>{dashboardData.sharedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Shared</Text>
              </View>
            </View>
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
          <Text style={[styles.greeting, { color: colors.primary }]}>Hi, {user?.name}</Text>
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
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 4,
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
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
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
});