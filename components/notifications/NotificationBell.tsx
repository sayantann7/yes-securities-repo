import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationModal from './NotificationModal';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export default function NotificationBell({ 
  size = 24, 
  color = Colors.text 
}: NotificationBellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowNotifications(true)}
      >
        <Bell size={size} color={color} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
