import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/context/AuthContext';
import { Home as HomeIcon, Folder as FolderIcon, Search as SearchIcon, User as UserIcon, Settings as AdminIcon, Bookmark as BookmarkIcon } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const { user } = useAuth();
  const colors = Colors;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="index"
        component={require('./index').default}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="search"
        component={require('./search').default}
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="bookmarks"
        component={require('./bookmarks').default}
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, size }) => <BookmarkIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="profile"
        component={require('./profile').default}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
      {user?.role === 'admin' && (
        <Tab.Screen
          name="admin"
          component={require('./admin').default}
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <AdminIcon color={color} size={size} />,
          }}
        />
      )}
      {user?.role === 'admin' && (
        <Tab.Screen
          name="documents"
          component={require('../documents').default}
          options={{
            title: 'Documents',
            tabBarIcon: ({ color, size }) => <FolderIcon color={color} size={size} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}