import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Home as HomeIcon, Folder as FolderIcon, Search as SearchIcon, User as UserIcon, Settings as AdminIcon, Bookmark as BookmarkIcon } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const { user } = useAuth();
  const colors = Colors;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, size }) => <BookmarkIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
      {user?.role === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <AdminIcon color={color} size={size} />,
          }}
        />
      )}
      {user?.role === 'admin' && (
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documents',
            tabBarIcon: ({ color, size }) => <FolderIcon color={color} size={size} />,
          }}
        />
      )}
    </Tabs>
  );
}