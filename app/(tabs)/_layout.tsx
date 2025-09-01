import { Tabs } from 'expo-router';
import { PhoneIncoming as HomeIcon, Folder as FolderIcon, Search as SearchIcon, User as UserIcon, Bell as BellIcon } from 'lucide-react-native';
import { Text, StyleSheet, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { typography } from '@/constants/font';
import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '@/services/notificationService';

export default function TabLayout() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try { const c = await getUnreadNotificationCount(); if (mounted) setUnread(c); } catch {}
    };
    load();
    const id = setInterval(load, 30000); // poll every 30s lightweight
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2d89fc',
        tabBarInactiveTintColor: '#dce7fa',
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? 
            <BlurView 
              tint="light" 
              intensity={80} 
              style={StyleSheet.absoluteFill} 
            /> : null
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => (
            <FolderIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <SearchIcon color={color} size={size} />
          ),
        }}
      />
      {user && user.role !== 'admin' && (
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => (
              <View>
                <BellIcon color={color} size={size} />
                {unread > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>
                )}
              </View>
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    borderRadius: 20,
    height: 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: typography.primary,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#ff3b30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: { color:'#fff', fontSize:10, fontWeight:'700' }
});