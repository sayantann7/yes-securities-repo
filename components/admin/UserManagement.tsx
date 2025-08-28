import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { 
  Users, 
  Download, 
  Send, 
  Clock, 
  Eye, 
  UserCheck, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Star,
  Filter,
  Search,
  RefreshCw,
  FileText,
  Activity,
  UserX,
  Plus,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { UserMetrics, UserOverallMetrics, UserActivityStatus } from '@/types';
import { adminNotificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface UserItemProps {
  user: UserMetrics;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const UserItem = ({ user, isSelected, onToggleSelect }: UserItemProps) => {
  const getActivityColor = (daysInactive: number, signIns: number = 1) => {
    // Users with 0 logins are considered inactive
    if (signIns <= 0) return '#EA4335'; // Red
    if (daysInactive <= 1) return '#34A853'; // Green - Very Active
    if (daysInactive <= 7) return '#FBBC05'; // Yellow - Active
    if (daysInactive <= 30) return '#FF9800'; // Orange - Inactive
    return '#EA4335'; // Red - Very Inactive
  };

  const getActivityLabel = (daysInactive: number, signIns: number = 1) => {
    // Users with 0 logins are considered inactive
    if (signIns <= 0) return 'Inactive';
    if (daysInactive <= 1) return 'Very Active';
    if (daysInactive <= 7) return 'Active';
    if (daysInactive <= 30) return 'Inactive';
    return 'Very Inactive';
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'Never') return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.userItem,
        { backgroundColor: Colors.surface },
        isSelected && { backgroundColor: '#E3F2FD', borderColor: Colors.primary, borderWidth: 2 }
      ]}
      onPress={onToggleSelect}
    >
      <View style={styles.userHeader}>
        <View style={styles.userBasicInfo}>
          <Text style={[styles.userName, { color: Colors.text }]}>
            {user.fullname}
          </Text>
          <Text style={[styles.userEmail, { color: Colors.textSecondary }]}>
            {user.email}
          </Text>
          <View style={styles.userRole}>
            <Text style={[styles.roleText, { color: Colors.primary }]}>
              {(user.role ? user.role : 'user').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.userStatus}>
          <View style={[
            styles.activityIndicator, 
            { backgroundColor: getActivityColor(user.daysInactive || 0, user.numberOfSignIns || 0) }
          ]} />
          <Text style={[styles.activityText, { color: getActivityColor(user.daysInactive || 0, user.numberOfSignIns || 0) }]}>
            {getActivityLabel(user.daysInactive || 0, user.numberOfSignIns || 0)}
          </Text>
          <Switch
            value={isSelected}
            onValueChange={onToggleSelect}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={isSelected ? 'white' : Colors.textSecondary}
            style={styles.selectSwitch}
          />
        </View>
      </View>

      <View style={styles.userMetrics}>
        <View style={styles.metricItem}>
          <Clock size={16} color={Colors.textSecondary} />
          <Text style={[styles.metricText, { color: Colors.textSecondary }]}>
            {formatTimeSpent(user.timeSpent)}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Eye size={16} color={Colors.textSecondary} />
          <Text style={[styles.metricText, { color: Colors.textSecondary }]}>
            {user.documentsViewed} docs
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <UserCheck size={16} color={Colors.textSecondary} />
          <Text style={[styles.metricText, { color: Colors.textSecondary }]}>
            {user.numberOfSignIns} logins
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Calendar size={16} color={Colors.textSecondary} />
          <Text style={[styles.metricText, { color: Colors.textSecondary }]}>
            {formatDate(user.lastSignIn)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MetricCard = ({ title, value, subtitle, icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <View style={[styles.metricCard, { backgroundColor: Colors.surface }]}>
    <View style={styles.metricCardHeader}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <Text style={[styles.metricValue, { color: Colors.text }]}>{value}</Text>
    </View>
    <Text style={[styles.metricTitle, { color: Colors.textSecondary }]}>{title}</Text>
    {subtitle && (
      <Text style={[styles.metricSubtitle, { color: Colors.textSecondary }]}>{subtitle}</Text>
    )}
  </View>
);

export default function UserManagement() {
  const { user } = useAuth();
  // Separate immediate input (searchInput) from committed query (searchQuery) used for fetching.
  const SEARCH_INACTIVITY_DELAY = 3000; // ms after last keystroke before committing
  const MIN_SEARCH_CHARS = 2; // don't fire queries for 1 char unless cleared
  const [users, setUsers] = useState<UserMetrics[]>([]); // accumulated users (capped)
  const [overallMetrics, setOverallMetrics] = useState<UserOverallMetrics | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportCancelled, setExportCancelled] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursors, setPrevCursors] = useState<string[]>([]); // stack of previous page starting ids
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  // Server-driven filters
  const [pingMessage, setPingMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // committed value that triggers fetch
  const [searchInput, setSearchInput] = useState(''); // live text input
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'timeSpent' | 'documentsViewed' | 'lastSignIn'>('name');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');

  // Map UI sort to backend sort field + order
  const buildSortParams = () => {
    switch (sortBy) {
      case 'name':
        return { sort: 'fullname', order: sortOrder };
      case 'timeSpent':
        return { sort: 'timeSpent', order: 'desc' as const };
      case 'documentsViewed':
        return { sort: 'documentsViewed', order: 'desc' as const };
      case 'lastSignIn':
        return { sort: 'lastSignIn', order: 'desc' as const };
      default:
        return { sort: 'createdAt', order: 'desc' as const };
    }
  };

  const fetchFirstPage = useCallback(async (force?: boolean) => {
    try {
      setIsLoading(true);
      if (force) adminNotificationService.invalidateUsersMetrics?.();
    const { sort, order } = buildSortParams();
    const activity = filterStatus === 'all' ? undefined : filterStatus; // backend uses 'active'|'inactive'
  const data = await adminNotificationService.getUsersMetricsPage({ limit: PAGE_SIZE, includeOverall: true, q: searchQuery || undefined, sort, order, activity });
  setUsers(data.users || []);
      setOverallMetrics(data.overallMetrics || null);
      setNextCursor(data.pageInfo?.nextCursor || null);
      setPrevCursors([]);
      setCurrentPage(1);
      setSelectedUsers(new Set());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user metrics');
  setUsers([]);
      setOverallMetrics(null);
      setNextCursor(null);
      setPrevCursors([]);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterStatus, sortBy, sortOrder]);

  const fetchNextPage = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const { sort, order } = buildSortParams();
      const activity = filterStatus === 'all' ? undefined : filterStatus;
      const data = await adminNotificationService.getUsersMetricsPage({ cursor: nextCursor, limit: PAGE_SIZE, q: searchQuery || undefined, sort, order, activity });
      // push previous window start id onto stack (we use first user id of current page)
      if (users[0]?.id) setPrevCursors(prev => [...prev, users[0].id]);
      setUsers(data.users || []);
      setNextCursor(data.pageInfo?.nextCursor || null);
      setSelectedUsers(new Set());
      setCurrentPage(p => p + 1);
    } catch (err) {
      console.error('Load next page failed', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, searchQuery, filterStatus, sortBy, sortOrder, users]);

  const fetchPrevPage = useCallback(async () => {
    if (prevCursors.length === 0 || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const { sort, order } = buildSortParams();
      const activity = filterStatus === 'all' ? undefined : filterStatus;
      // We need to refetch from the beginning building forward until reaching desired cursor predecessor.
      // Simpler: request a fresh first page then iterate using stored stack excluding last to reconstruct.
      const chain = [...prevCursors];
      const targetStack = chain.slice(0, -1); // after popping one
      let cursor: string | undefined = undefined;
      let pageUsers: UserMetrics[] = [];
      let next: string | null = null;
      // Rebuild pages until we reach last remaining stack top
      const rebuild = async () => {
        const resp = await adminNotificationService.getUsersMetricsPage({ cursor, limit: PAGE_SIZE, q: searchQuery || undefined, sort, order, activity });
        pageUsers = resp.users || [];
        next = resp.pageInfo?.nextCursor || null;
        if (!cursor && pageUsers.length) {
          // initial page already good if stack empty
          return;
        }
      };
      // Start from scratch
      const firstResp = await adminNotificationService.getUsersMetricsPage({ limit: PAGE_SIZE, includeOverall: true, q: searchQuery || undefined, sort, order, activity });
      let rebuiltUsers = firstResp.users || [];
      let rebuiltNext = firstResp.pageInfo?.nextCursor || null;
      const stackToRebuild = targetStack; // ids of starting pages except current
      let index = 0;
      let lastStartId = rebuiltUsers[0]?.id;
      while (index < stackToRebuild.length && rebuiltNext) {
        const resp = await adminNotificationService.getUsersMetricsPage({ cursor: rebuiltNext, limit: PAGE_SIZE, q: searchQuery || undefined, sort, order, activity });
        // push previous start id to mimic progression
        lastStartId = resp.users?.[0]?.id;
        rebuiltUsers = resp.users || [];
        rebuiltNext = resp.pageInfo?.nextCursor || null;
        index++;
      }
      setUsers(rebuiltUsers);
      setNextCursor(rebuiltNext);
      setPrevCursors(prev => prev.slice(0, -1));
      setCurrentPage(p => Math.max(1, p - 1));
      setSelectedUsers(new Set());
    } catch (err) {
      console.error('Load previous page failed', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [prevCursors, isLoadingMore, searchQuery, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.');
      return;
    }
    fetchFirstPage();
  }, [user, fetchFirstPage]);

  // Commit searchInput -> searchQuery after user stops typing.
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const id = setTimeout(() => {
      if (searchInput === searchQuery) return;
      if (searchInput.length === 0 || searchInput.length >= MIN_SEARCH_CHARS) {
        setSearchQuery(searchInput);
      }
    }, SEARCH_INACTIVITY_DELAY);
    return () => clearTimeout(id);
  }, [searchInput, searchQuery, user]);

  // Fetch when committed query / filters change (tiny delay to batch rapid programmatic updates)
  useEffect(() => {
    if (user?.role === 'admin') {
      const id = setTimeout(() => fetchFirstPage(), 80);
      return () => clearTimeout(id);
    }
  }, [searchQuery, filterStatus, sortBy, sortOrder, fetchFirstPage, user]);

  // applyFiltersAndSort removed - now server side

  const handleToggleUser = (userId: string) => {
  setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((user: UserMetrics) => user.id)));
    }
  };

  const handleSendPing = async () => {
    if (selectedUsers.size === 0) {
      Alert.alert('No Users Selected', 'Please select at least one user to ping.');
      return;
    }

    if (!pingMessage.trim()) {
      Alert.alert('No Message', 'Please enter a message to send to the users.');
      return;
    }

    Alert.alert(
      'Send Ping',
      `Send notification to ${selectedUsers.size} user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setIsSending(true);
              await adminNotificationService.pingInactiveUsers(
                Array.from(selectedUsers), 
                pingMessage
              );
              Alert.alert('Success', 'Ping notifications sent successfully!');
              setPingMessage('');
              setSelectedUsers(new Set());
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to send ping notifications');
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  // Fetch all pages for export (optionally filter by activity) without altering on-screen list
  const fetchAllUsersForExport = async (activity?: 'active' | 'inactive'): Promise<UserMetrics[]> => {
    const aggregated: UserMetrics[] = [];
    let cursor: string | null | undefined = undefined;
    let first = true;
    setExportProgress(0);
    setExportCancelled(false);
    const targetTotal = activity === 'active'
      ? overallMetrics?.activeUsers
      : activity === 'inactive'
        ? overallMetrics?.inactiveUsers
        : overallMetrics?.totalUsers;
    try {
      do {
        if (exportCancelled) break;
        const { sort, order } = buildSortParams();
        const page = await adminNotificationService.getUsersMetricsPage({
          cursor: cursor || undefined,
          limit: 200,
          includeOverall: first,
          activity,
          sort,
          order
        });
        if (Array.isArray(page.users)) aggregated.push(...page.users);
        cursor = page.pageInfo?.nextCursor;
        first = false;
        if (targetTotal && targetTotal > 0) {
          const pct = Math.min(100, Math.round((aggregated.length / targetTotal) * 100));
          setExportProgress(pct);
        }
      } while (cursor);
    } catch (e) {
      console.error('Full export fetch failed', e);
    }
    return aggregated;
  };

  const exportToExcel = async (exportType: 'all' | 'selected' | 'inactive' | 'active') => {
    let dataToExport: UserMetrics[] = [];
    let filename = '';

    switch (exportType) {
      case 'all':
        if (overallMetrics && users.length < overallMetrics.totalUsers) {
          setIsExporting(true);
          dataToExport = await fetchAllUsersForExport();
          setIsExporting(false);
          if (exportCancelled) return;
        } else {
          dataToExport = users;
        }
        filename = 'all_users_metrics.xlsx';
        break;
      case 'active':
        setIsExporting(true);
        dataToExport = await fetchAllUsersForExport('active');
        setIsExporting(false);
        if (exportCancelled) return;
        filename = 'active_users_metrics.xlsx';
        break;
      case 'selected':
        if (selectedUsers.size === 0) {
          Alert.alert('No Users Selected', 'Please select users to export.');
          return;
        }
  dataToExport = users.filter((user: UserMetrics) => selectedUsers.has(user.id));
        filename = 'selected_users_metrics.xlsx';
        break;
      case 'inactive':
        setIsExporting(true);
        dataToExport = await fetchAllUsersForExport('inactive');
        setIsExporting(false);
        if (exportCancelled) return;
        filename = 'inactive_users_metrics.xlsx';
        break;
    }

    if (dataToExport.length === 0) {
      Alert.alert('No Data', 'No users to export.');
      return;
    }

    // Prepare data for Excel
    const excelData = dataToExport.map(user => ({
      'Full Name': user.fullname,
      'Email': user.email,
  'Role': user.role || 'user',
      'Time Spent (minutes)': user.timeSpent,
      'Documents Viewed': user.documentsViewed,
      'Total Sign-ins': user.numberOfSignIns,
      'Last Sign-in': user.lastSignIn === 'Never' || !user.lastSignIn ? 'Never' : new Date(user.lastSignIn).toLocaleDateString(),
      'Days Inactive': user.daysInactive || 0,
      'Account Created': new Date(user.createdAt).toLocaleDateString(),
      'Status': ((user.numberOfSignIns || 0) > 0 && (user.daysInactive ?? Infinity) <= 7) ? 'Active' : 'Inactive'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Metrics');

    // Save and share file
    try {
      if (Platform.OS === 'web') {
        XLSX.writeFile(workbook, filename);
        Alert.alert('Success', 'Excel file downloaded successfully');
      } else {
        // For mobile platforms
        const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        const fileUri = FileSystem.documentDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export User Metrics',
          });
        } else {
          Alert.alert('Success', `Excel file saved to ${filename}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export Excel file. Please try again.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={[styles.accessDeniedText, { color: Colors.error }]}>
          Access Denied: Admin privileges required
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
          Loading user metrics...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: Colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: Colors.primary }]}
          onPress={() => fetchFirstPage(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>User Management</Text>
  <TouchableOpacity style={styles.refreshButton} onPress={() => fetchFirstPage(true)}>
          <RefreshCw size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Metrics */}
        {overallMetrics && (
          <View style={styles.metricsSection}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Overall Metrics</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsScroll}>
              <MetricCard
                title="Total Users"
                value={overallMetrics.totalUsers}
                icon={<Users size={20} color={Colors.primary} />}
                color={Colors.primary}
              />
              <MetricCard
                title="Active Users"
                value={overallMetrics.activeUsers}
                subtitle="Last 7 days"
                icon={<UserCheck size={20} color="#34A853" />}
                color="#34A853"
              />
              <MetricCard
                title="Inactive Users"
                value={overallMetrics.inactiveUsers}
                subtitle="7+ days"
                icon={<Clock size={20} color="#EA4335" />}
                color="#EA4335"
              />
              <MetricCard
                title="Avg Time Spent"
                value={`${overallMetrics.averageTimeSpent}m`}
                icon={<TrendingUp size={20} color="#FBBC05" />}
                color="#FBBC05"
              />
              <MetricCard
                title="Total Doc Views"
                value={overallMetrics.totalDocumentViews}
                icon={<Eye size={20} color="#4285F4" />}
                color="#4285F4"
              />
              <MetricCard
                title="New Users"
                value={overallMetrics.newUsersThisWeek}
                subtitle="This week"
                icon={<Calendar size={20} color="#9C27B0" />}
                color="#9C27B0"
              />
              <MetricCard
                title="Most Active"
                value={overallMetrics.mostActiveUser.name}
                subtitle={`${overallMetrics.mostActiveUser.timeSpent}m`}
                icon={<Star size={20} color="#FF9800" />}
                color="#FF9800"
              />
            </ScrollView>
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: Colors.text }]}
              placeholder="Search users..."
              placeholderTextColor={Colors.textSecondary}
              value={searchInput}
              onChangeText={setSearchInput}
              autoCapitalize='none'
              autoCorrect={false}
              onSubmitEditing={() => {
                if (searchInput !== searchQuery) {
                  setSearchQuery(searchInput);
                }
              }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: filterStatus === 'all' ? Colors.primary : Colors.surface }
              ]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterStatus === 'all' ? 'white' : Colors.textSecondary }
              ]}>
                Window (20)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: filterStatus === 'active' ? Colors.primary : Colors.surface }
              ]}
              onPress={() => setFilterStatus('active')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterStatus === 'active' ? 'white' : Colors.textSecondary }
              ]}>
                Active (page)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: filterStatus === 'inactive' ? Colors.primary : Colors.surface }
              ]}
              onPress={() => setFilterStatus('inactive')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterStatus === 'inactive' ? 'white' : Colors.textSecondary }
              ]}>
                Inactive (page)
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtons}>
            {[
              { key: 'name', label: 'Name' },
              { key: 'timeSpent', label: 'Time Spent' },
              { key: 'documentsViewed', label: 'Doc Views' },
              { key: 'lastSignIn', label: 'Last Sign-in' }
            ].map(sort => (
              <TouchableOpacity
                key={sort.key}
                style={[
                  styles.sortButton,
                  { backgroundColor: sortBy === sort.key ? Colors.primary : Colors.surface }
                ]}
                onPress={() => setSortBy(sort.key as any)}
              >
                <Text style={[
                  styles.sortButtonText,
                  { color: sortBy === sort.key ? 'white' : Colors.textSecondary }
                ]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView> */}
        </View>

        {/* Export Buttons */}
        <View style={styles.exportSection}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Export Options</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: Colors.primary, opacity: isExporting ? 0.6 : 1 }]}
              onPress={() => exportToExcel('all').catch(err => console.error('Export error:', err))}
              disabled={isExporting}
            >
              <Download size={16} color="white" />
              <Text style={styles.exportButtonText}>All Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#1976D2', opacity: isExporting ? 0.6 : 1 }]}
              onPress={() => exportToExcel('active').catch(err => console.error('Export error:', err))}
              disabled={isExporting}
            >
              <Download size={16} color="white" />
              <Text style={styles.exportButtonText}>Active Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#34A853', opacity: (selectedUsers.size === 0 || isExporting) ? 0.6 : 1 }]}
              onPress={() => exportToExcel('selected').catch(err => console.error('Export error:', err))}
              disabled={selectedUsers.size === 0 || isExporting}
            >
              <Download size={16} color="white" />
              <Text style={styles.exportButtonText}>Selected ({selectedUsers.size})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#EA4335', opacity: isExporting ? 0.6 : 1 }]}
              onPress={() => exportToExcel('inactive').catch(err => console.error('Export error:', err))}
              disabled={isExporting}
            >
              <Download size={16} color="white" />
              <Text style={styles.exportButtonText}>Inactive Users</Text>
            </TouchableOpacity>
          </ScrollView>
          {isExporting && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary }}>Exporting... {exportProgress}%</Text>
              <TouchableOpacity onPress={() => setExportCancelled(true)} style={{ padding: 6 }}>
                <Text style={{ color: Colors.error }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selection Header */}
  {users.length > 0 && (
          <View style={styles.selectionHeader}>
            <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAll}>
              <Text style={[styles.selectAllText, { color: Colors.primary }]}>
                {selectedUsers.size === users.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.selectedCount, { color: Colors.textSecondary }]}>
              {selectedUsers.size} of {users.length} selected
            </Text>
          </View>
        )}

        {/* Users List */}
  {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={48} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              No users found
            </Text>
            {searchQuery && (
              <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>
                Try adjusting your search or filters
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UserItem
                user={item}
                isSelected={selectedUsers.has(item.id)}
                onToggleSelect={() => handleToggleUser(item.id)}
              />
            )}
            style={styles.usersList}
            contentContainerStyle={styles.usersContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => (
              <View style={{ paddingVertical: 16 }}>
                {(isLoadingMore || isExporting) && <ActivityIndicator color={Colors.primary} />}
                {/* Pagination Controls */}
                {!isLoadingMore && !isExporting && (
                  <View style={styles.paginationBar}>
                    <TouchableOpacity
                      style={[styles.pageButton, prevCursors.length === 0 && styles.pageButtonDisabled]}
                      disabled={prevCursors.length === 0 || isLoadingMore}
                      onPress={fetchPrevPage}
                    >
                      <Text style={styles.pageButtonText}>Prev</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageIndicator}>Page {currentPage}</Text>
                    <TouchableOpacity
                      style={[styles.pageButton, !nextCursor && styles.pageButtonDisabled]}
                      disabled={!nextCursor || isLoadingMore}
                      onPress={fetchNextPage}
                    >
                      <Text style={styles.pageButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )}

        {/* Ping Section */}
        {selectedUsers.size > 0 && (
          <View style={styles.pingSection}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>
              Send Message to Selected Users
            </Text>
            <TextInput
              style={[styles.messageInput, { 
                borderColor: Colors.border, 
                color: Colors.text,
                backgroundColor: Colors.surface 
              }]}
              placeholder="Enter message to send to selected users..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              value={pingMessage}
              onChangeText={setPingMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: Colors.primary,
                  opacity: isSending ? 0.6 : 1
                }
              ]}
              onPress={handleSendPing}
              disabled={isSending}
            >
              <Send size={20} color="white" />
              <Text style={styles.sendButtonText}>
                {isSending ? 'Sending...' : `Send to ${selectedUsers.size} user(s)`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  metricsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsScroll: {
    flexDirection: 'row',
  },
  metricCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
  },
  filtersSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    elevation: 1,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exportSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  exportButtons: {
    flexDirection: 'row',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    gap: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  selectAllButton: {
    padding: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
  },
  usersList: {
    flex: 1,
  },
  usersContent: {
    padding: 16,
  },
  userItem: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userBasicInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  userRole: {
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 10,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'center',
  },
  activityText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  userMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flex: 1,
    minWidth: '45%',
  },
  metricText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  pingSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
    gap: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
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
  paginationBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  pageButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  pageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    minWidth: 80,
    textAlign: 'center',
  },
});
