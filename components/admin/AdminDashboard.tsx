import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { 
  MessageCircle, 
  Users, 
  Bell, 
  FileText, 
  TrendingUp, 
  Activity,
  UserCheck,
  Upload
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useFetchAdminDashboard } from '@/hooks/useFetchAdminDashboard';
import DashboardStat from './DashboardStat';
import AdminCommentsPage from './AdminCommentsPage';
import UserManagement from './UserManagement';
import NotificationManagement from './NotificationManagement';

interface AdminDashboardProps {
  onNavigateToComments?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToNotifications?: () => void;
}

type ActiveTab = 'overview' | 'comments' | 'users' | 'notifications';

export default function AdminDashboard({ 
  onNavigateToComments, 
  onNavigateToUsers, 
  onNavigateToNotifications 
}: AdminDashboardProps) {
  const { user } = useAuth();
  const { dashboardData, isLoading, error } = useFetchAdminDashboard();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh dashboard data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this dashboard.');
      return;
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={[styles.accessDeniedText, { color: Colors.error }]}>
          Access Denied: Admin privileges required
        </Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'comments':
        return <AdminCommentsPage />;
      case 'users':
        return <UserManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'overview':
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.overviewContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
          User Activity Overview
        </Text>
        
        <View style={styles.statsGrid}>
          {dashboardData && (
            <>
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
              <DashboardStat
                label="Time Spent (min)"
                value={dashboardData.userActivity.timeSpent.currentWeek}
                comparisonValue={dashboardData.userActivity.timeSpent.lastWeek}
                percentageChange={dashboardData.userActivity.timeSpent.percentageChange}
                isLoading={isLoading}
              />
            </>
          )}
        </View>
      </View>

      {/* Content Overview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
          Content Overview
        </Text>
        
        <View style={styles.contentGrid}>
          <View style={[styles.contentCard, { backgroundColor: Colors.surface }]}>
            <View style={[styles.contentIconContainer, { backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
              <FileText size={20} color="#4285F4" />
            </View>
            <Text style={[styles.contentValue, { color: Colors.primary }]}>
              {dashboardData?.documentsCount || 0}
            </Text>
            <Text style={[styles.contentLabel, { color: Colors.textSecondary }]}>
              Documents
            </Text>
          </View>

          <View style={[styles.contentCard, { backgroundColor: Colors.surface }]}>
            <View style={[styles.contentIconContainer, { backgroundColor: 'rgba(251, 188, 5, 0.1)' }]}>
              <MessageCircle size={20} color="#FBBC05" />
            </View>
            <Text style={[styles.contentValue, { color: Colors.primary }]}>
              {dashboardData?.starredCount || 0}
            </Text>
            <Text style={[styles.contentLabel, { color: Colors.textSecondary }]}>
              Comments
            </Text>
          </View>

          <View style={[styles.contentCard, { backgroundColor: Colors.surface }]}>
            <View style={[styles.contentIconContainer, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
              <Users size={20} color="#34A853" />
            </View>
            <Text style={[styles.contentValue, { color: Colors.primary }]}>
              {dashboardData?.sharedCount || 0}
            </Text>
            <Text style={[styles.contentLabel, { color: Colors.textSecondary }]}>
              Active Users
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
          Quick Actions
        </Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.surface }]}
            onPress={() => setActiveTab('comments')}
          >
            <MessageCircle size={24} color={Colors.primary} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>
              Manage Comments
            </Text>
            <Text style={[styles.actionDescription, { color: Colors.textSecondary }]}>
              View and reply to document comments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.surface }]}
            onPress={() => setActiveTab('users')}
          >
            <UserCheck size={24} color={Colors.primary} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>
              Inactive Users
            </Text>
            <Text style={[styles.actionDescription, { color: Colors.textSecondary }]}>
              Ping and manage inactive users
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.surface }]}
            onPress={onNavigateToNotifications}
          >
            <Bell size={24} color={Colors.primary} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>
              Notifications
            </Text>
            <Text style={[styles.actionDescription, { color: Colors.textSecondary }]}>
              View notification settings and history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.surface }]}
          >
            <Upload size={24} color={Colors.primary} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>
              Upload Files
            </Text>
            <Text style={[styles.actionDescription, { color: Colors.textSecondary }]}>
              Upload documents and notify users
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Features Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
          Notification Features
        </Text>
        
        <View style={[styles.featureCard, { backgroundColor: Colors.surface }]}>
          <View style={styles.featureHeader}>
            <Bell size={20} color={Colors.primary} />
            <Text style={[styles.featureTitle, { color: Colors.text }]}>
              Active Notification Systems
            </Text>
          </View>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.featureText, { color: Colors.text }]}>
                Comment notifications to admin and sales team
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.featureText, { color: Colors.text }]}>
                Upload notifications to all users
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.featureText, { color: Colors.text }]}>
                Admin ping/alert system for inactive users
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.featureText, { color: Colors.text }]}>
                Document-wise comment management
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && { backgroundColor: Colors.primary }
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Activity size={20} color={activeTab === 'overview' ? '#FFFFFF' : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'overview' ? '#FFFFFF' : Colors.textSecondary }
          ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'comments' && { backgroundColor: Colors.primary }
          ]}
          onPress={() => setActiveTab('comments')}
        >
          <MessageCircle size={20} color={activeTab === 'comments' ? '#FFFFFF' : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'comments' ? '#FFFFFF' : Colors.textSecondary }
          ]}>
            Comments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'users' && { backgroundColor: Colors.primary }
          ]}
          onPress={() => setActiveTab('users')}
        >
          <Users size={20} color={activeTab === 'users' ? '#FFFFFF' : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'users' ? '#FFFFFF' : Colors.textSecondary }
          ]}>
            Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'notifications' && { backgroundColor: Colors.primary }
          ]}
          onPress={() => setActiveTab('notifications')}
        >
          <Bell size={20} color={activeTab === 'notifications' ? '#FFFFFF' : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'notifications' ? '#FFFFFF' : Colors.textSecondary }
          ]}>
            Notifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    paddingTop: 60,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  contentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contentCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
