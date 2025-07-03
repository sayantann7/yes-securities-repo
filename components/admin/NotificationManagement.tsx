import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Bell, Check, X, Clock, Users, Upload, MessageCircle, AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Notification } from '@/types';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle size={20} color="#4285F4" />;
      case 'upload':
        return <Upload size={20} color="#34A853" />;
      case 'ping':
      case 'alert':
        return <AlertTriangle size={20} color="#FBBC05" />;
      default:
        return <Bell size={20} color={Colors.textSecondary} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'rgba(66, 133, 244, 0.1)';
      case 'upload':
        return 'rgba(52, 168, 83, 0.1)';
      case 'ping':
      case 'alert':
        return 'rgba(251, 188, 5, 0.1)';
      default:
        return Colors.surfaceVariant;
    }
  };

  return (
    <View style={[
      styles.notificationItem,
      { backgroundColor: Colors.surface },
      !notification.read && { borderLeftColor: Colors.primary, borderLeftWidth: 4 }
    ]}>
      <View style={styles.notificationHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) }]}>
          {getNotificationIcon(notification.type)}
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: Colors.text }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: Colors.textSecondary }]}>
            {notification.message}
          </Text>
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationTime, { color: Colors.textSecondary }]}>
              {getTimeAgo(notification.createdAt)}
            </Text>
            {notification.sender && (
              <Text style={[styles.notificationSender, { color: Colors.textSecondary }]}>
                • From {notification.sender.name}
              </Text>
            )}
          </View>
        </View>
        {!notification.read && (
          <TouchableOpacity
            style={[styles.markReadButton, { backgroundColor: Colors.primary }]}
            onPress={() => onMarkAsRead(notification.id)}
          >
            <Check size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.');
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const userNotifications = await notificationService.getNotifications();
      setNotifications(userNotifications);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      Alert.alert('Success', 'All notifications marked as read');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark all notifications as read');
    }
  };

  const getNotificationStats = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const commentCount = notifications.filter(n => n.type === 'comment').length;
    const uploadCount = notifications.filter(n => n.type === 'upload').length;
    const pingCount = notifications.filter(n => n.type === 'ping' || n.type === 'alert').length;

    return { unreadCount, commentCount, uploadCount, pingCount };
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
          Loading notifications...
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
          onPress={fetchNotifications}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getNotificationStats();

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
        <Text style={[styles.title, { color: Colors.text }]}>
          Notification Management
        </Text>
        {stats.unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: Colors.primary }]}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: Colors.surface }]}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(234, 67, 53, 0.1)' }]}>
            <Bell size={16} color="#EA4335" />
          </View>
          <Text style={[styles.statValue, { color: Colors.text }]}>{stats.unreadCount}</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Unread</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
            <MessageCircle size={16} color="#4285F4" />
          </View>
          <Text style={[styles.statValue, { color: Colors.text }]}>{stats.commentCount}</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Comments</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
            <Upload size={16} color="#34A853" />
          </View>
          <Text style={[styles.statValue, { color: Colors.text }]}>{stats.uploadCount}</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Uploads</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(251, 188, 5, 0.1)' }]}>
            <AlertTriangle size={16} color="#FBBC05" />
          </View>
          <Text style={[styles.statValue, { color: Colors.text }]}>{stats.pingCount}</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Alerts</Text>
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={Colors.textSecondary} />
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
            No notifications found
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 16,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationSender: {
    fontSize: 12,
    marginLeft: 4,
  },
  markReadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
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
