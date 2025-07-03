import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Users, Zap, AlertTriangle, Send } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { InactiveUser } from '@/types';
import { adminNotificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

interface InactiveUserItemProps {
  user: InactiveUser;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const InactiveUserItem = ({ user, isSelected, onToggleSelect }: InactiveUserItemProps) => {
  const getInactivityColor = (days: number) => {
    if (days >= 30) return Colors.error;
    if (days >= 14) return Colors.warning;
    return Colors.textSecondary;
  };

  return (
    <TouchableOpacity
      style={[
        styles.userItem,
        { backgroundColor: Colors.surface },
        isSelected && { backgroundColor: '#E3F2FD' }
      ]}
      onPress={onToggleSelect}
    >
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: Colors.text }]}>
          {user.name}
        </Text>
        <Text style={[styles.userEmail, { color: Colors.textSecondary }]}>
          {user.email}
        </Text>
        <Text style={[styles.lastSignIn, { color: getInactivityColor(user.daysInactive) }]}>
          Last active: {user.daysInactive} days ago
        </Text>
      </View>
      <View style={styles.userActions}>
        <Switch
          value={isSelected}
          onValueChange={onToggleSelect}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={isSelected ? 'white' : Colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default function InactiveUsersManagement() {
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysSinceLastSignIn, setDaysSinceLastSignIn] = useState(7);
  const [pingMessage, setPingMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.');
      return;
    }
    fetchInactiveUsers();
  }, [user, daysSinceLastSignIn]);

  const fetchInactiveUsers = async () => {
    try {
      setIsLoading(true);
      const users = await adminNotificationService.getInactiveUsers(daysSinceLastSignIn);
      setInactiveUsers(users);
      setSelectedUsers(new Set()); // Clear selection when refetching
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inactive users');
      setInactiveUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (selectedUsers.size === inactiveUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(inactiveUsers.map(user => user.id)));
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
                pingMessage.trim()
              );
              
              Alert.alert('Success', 'Notifications sent successfully!');
              setSelectedUsers(new Set());
              setPingMessage('');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to send notifications');
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
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

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>
          Inactive Users
        </Text>
        <TouchableOpacity onPress={fetchInactiveUsers} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: Colors.primary }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: Colors.text }]}>
          Show users inactive for:
        </Text>
        <View style={styles.daysSelector}>
          {[7, 14, 30].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.dayButton,
                {
                  backgroundColor: daysSinceLastSignIn === days ? Colors.primary : Colors.surface,
                  borderColor: Colors.border,
                }
              ]}
              onPress={() => setDaysSinceLastSignIn(days)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  { color: daysSinceLastSignIn === days ? 'white' : Colors.text }
                ]}
              >
                {days}+ days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
            Loading inactive users...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: Colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={fetchInactiveUsers}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : inactiveUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color={Colors.textSecondary} />
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
            No inactive users found
          </Text>
          <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>
            All users have been active within the last {daysSinceLastSignIn} days
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.selectionHeader}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Text style={[styles.selectAllText, { color: Colors.primary }]}>
                {selectedUsers.size === inactiveUsers.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.selectedCount, { color: Colors.textSecondary }]}>
              {selectedUsers.size} of {inactiveUsers.length} selected
            </Text>
          </View>

          <FlatList
            data={inactiveUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InactiveUserItem
                user={item}
                isSelected={selectedUsers.has(item.id)}
                onToggleSelect={() => handleToggleUser(item.id)}
              />
            )}
            style={styles.usersList}
            contentContainerStyle={styles.usersContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.pingSection}>
            <TextInput
              style={[styles.messageInput, { borderColor: Colors.border, color: Colors.text }]}
              placeholder="Enter message to send to inactive users..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              value={pingMessage}
              onChangeText={setPingMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: selectedUsers.size > 0 && pingMessage.trim() ? Colors.primary : Colors.textSecondary
                }
              ]}
              disabled={selectedUsers.size === 0 || !pingMessage.trim() || isSending}
              onPress={handleSendPing}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Zap size={16} color="white" />
                  <Text style={styles.sendButtonText}>
                    Ping {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
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
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayButtonText: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  lastSignIn: {
    fontSize: 12,
  },
  userActions: {
    marginLeft: 16,
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
    padding: 16,
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
});
